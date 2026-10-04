"""
Safe Project Inspector and Framework Detection Service
"""
import os
import json
import zipfile
import re
from pathlib import Path
from typing import Dict, Any, List, Tuple
from ..models import FileNode

IGNORE_PATTERNS = {
    "node_modules", ".git", ".next", "__pycache__", ".venv", "venv",
    "dist", "build", ".DS_Store", "coverage", ".turbo", "target",
    "uploads"  # Prevent recursing into any nested uploads dir inside a project
}

class ProjectInspector:

    @staticmethod
    def extract_zip_safely(zip_path: str, extract_to: str) -> bool:
        """
        Safely extracts a ZIP file preventing Zip Slip / path traversal attacks.
        """
        os.makedirs(extract_to, exist_ok=True)
        target_dir = os.path.abspath(extract_to)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # Disallow absolute paths and directory traversal
                member_path = os.path.abspath(os.path.join(target_dir, member.filename))
                try:
                    common = os.path.commonpath([target_dir, member_path])
                    if common != target_dir:
                        raise ValueError(f"Malicious zip entry detected: {member.filename}")
                except Exception as e:
                    raise ValueError(f"Unsafe path detected in zip file: {e}")

            # If all safe, extract
            zip_ref.extractall(target_dir)

        # Normalize single top-level directory wrapper if user zipped a folder
        extracted_items = [
            os.path.join(target_dir, item) 
            for item in os.listdir(target_dir) 
            if item not in ("__MACOSX",)
        ]
        if len(extracted_items) == 1 and os.path.isdir(extracted_items[0]):
            single_folder = extracted_items[0]
            for child in os.listdir(single_folder):
                dest = os.path.join(target_dir, child)
                if not os.path.exists(dest):
                    os.rename(os.path.join(single_folder, child), dest)
            # Remove the now-empty wrapper folder so it doesn't appear as a
            # lingering directory entry and cause doubled/nested path resolution.
            try:
                import shutil as _shutil
                _shutil.rmtree(single_folder, ignore_errors=True)
            except Exception:
                pass

        return True

    @staticmethod
    def find_project_root(root_dir: str) -> str:
        """
        Recursively find the actual project root by looking for manifest files.
        Returns the directory containing package.json, requirements.txt, etc.
        """
        manifest_files = [
            "package.json", "requirements.txt", "pyproject.toml", 
            "Cargo.toml", "pom.xml", "build.gradle", "go.mod",
            "Dockerfile", "docker-compose.yml"
        ]
        
        # Check current directory first
        for manifest in manifest_files:
            if os.path.exists(os.path.join(root_dir, manifest)):
                return root_dir
        
        # Recursively search subdirectories (max depth 3)
        for root, dirs, files in os.walk(root_dir):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_PATTERNS]
            
            # Don't go too deep
            depth = root[len(root_dir):].count(os.sep)
            if depth > 3:
                dirs[:] = []
                continue
            
            for manifest in manifest_files:
                if manifest in files:
                    return root
        
        return root_dir

    @staticmethod
    def build_file_tree(root_dir: str, max_depth: int = 3) -> Tuple[List[FileNode], int]:
        """
        Builds a safe, truncated file tree for frontend preview
        """
        total_files = 0

        def traverse(current_path: str, depth: int) -> List[FileNode]:
            nonlocal total_files
            nodes: List[FileNode] = []
            if depth > max_depth or not os.path.exists(current_path):
                return nodes

            try:
                entries = sorted(os.scandir(current_path), key=lambda e: (not e.is_dir(), e.name.lower()))
            except Exception:
                return nodes

            for entry in entries:
                if entry.name in IGNORE_PATTERNS or entry.name.startswith("."):
                    if entry.name not in [".env.example", ".env.sample", ".env.local"]:
                        continue

                rel_path = os.path.relpath(entry.path, root_dir).replace("\\", "/")
                if entry.is_dir():
                    children = traverse(entry.path, depth + 1)
                    nodes.append(FileNode(
                        name=entry.name,
                        path=rel_path,
                        type="folder",
                        children=children
                    ))
                else:
                    total_files += 1
                    size = 0
                    try:
                        size = entry.stat().st_size
                    except Exception:
                        pass
                    nodes.append(FileNode(
                        name=entry.name,
                        path=rel_path,
                        type="file",
                        size=size
                    ))
            return nodes

        tree = traverse(root_dir, 1)
        return tree, total_files

    @staticmethod
    def inspect_directory(root_dir: str) -> Dict[str, Any]:
        """
        Inspects directory contents to discover frameworks, languages, commands, dependencies.
        """
        files_found = set()
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_PATTERNS]
            for f in files:
                rel = os.path.relpath(os.path.join(root, f), root_dir).replace("\\", "/")
                files_found.add(rel)

        package_json_path = os.path.join(root_dir, "package.json")
        requirements_path = os.path.join(root_dir, "requirements.txt")
        dockerfile_path = os.path.join(root_dir, "Dockerfile")
        pom_xml_path = os.path.join(root_dir, "pom.xml")
        gradle_path = os.path.join(root_dir, "build.gradle")

        # Check for language-specific files in the project
        has_java_files = any(f.endswith(".java") for f in files_found)
        has_python_files = any(f.endswith(".py") for f in files_found)
        has_go_files = any(f.endswith(".go") for f in files_found)
        has_cs_files = any(f.endswith(".cs") for f in files_found)
        has_php_files = any(f.endswith(".php") for f in files_found)
        has_ruby_files = any(f.endswith(".rb") for f in files_found)

        detected_framework = "Static Web"
        detected_language = "JavaScript / HTML"
        detected_package_manager = "npm"
        build_command = ""
        start_command = ""
        output_dir = "dist"
        port = 3000
        database_detected = "None"
        dependencies: List[str] = []
        env_vars_detected: List[str] = []

        # 1. Check Node.js / JavaScript / TypeScript
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, "r", encoding="utf-8") as f:
                    pkg_data = json.load(f)
                    deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                    scripts = pkg_data.get("scripts", {})
                    dependencies = list(deps.keys())[:25]

                    has_ts = any("typescript" in k or k.endswith(".ts") or k.endswith(".tsx") for k in deps.keys())
                    detected_language = "TypeScript" if has_ts else "JavaScript"

                    if "pnpm-lock.yaml" in files_found:
                        detected_package_manager = "pnpm"
                    elif "yarn.lock" in files_found:
                        detected_package_manager = "yarn"
                    elif "bun.lockb" in files_found:
                        detected_package_manager = "bun"
                    else:
                        detected_package_manager = "npm"

                    # Framework rules
                    if "next" in deps:
                        detected_framework = "Next.js"
                        build_command = f"{detected_package_manager} run build"
                        start_command = f"{detected_package_manager} start"
                        output_dir = ".next"
                        port = 3000
                    elif "react" in deps:
                        if "vite" in deps or any("vite" in f for f in files_found):
                            detected_framework = "React (Vite)"
                            build_command = f"{detected_package_manager} run build"
                            start_command = f"{detected_package_manager} run preview"
                            output_dir = "dist"
                            port = 5173
                        else:
                            detected_framework = "React (SPA)"
                            build_command = f"{detected_package_manager} run build"
                            start_command = "npx serve -s build"
                            output_dir = "build"
                            port = 3000
                    elif "vue" in deps or "nuxt" in deps:
                        detected_framework = "Nuxt" if "nuxt" in deps else "Vue.js"
                        build_command = f"{detected_package_manager} run build"
                        start_command = f"{detected_package_manager} run preview"
                        output_dir = "dist"
                        port = 3000
                    elif "@angular/core" in deps:
                        detected_framework = "Angular"
                        build_command = f"{detected_package_manager} run build"
                        start_command = "npx serve -s dist"
                        output_dir = "dist"
                        port = 4200
                    elif "express" in deps or "fastify" in deps or "koa" in deps:
                        detected_framework = "Node.js (Express/Backend)"
                        build_command = scripts.get("build", "")
                        start_command = scripts.get("start", "node server.js" if "server.js" in files_found else "node index.js")
                        output_dir = "dist" if scripts.get("build") else ""
                        port = 5000
                    elif "astro" in deps:
                        detected_framework = "Astro"
                        build_command = f"{detected_package_manager} run build"
                        start_command = f"{detected_package_manager} run preview"
                        output_dir = "dist"
                        port = 4321

                    # Database checks in Node
                    if any("prisma" in d for d in deps):
                        database_detected = "Prisma ORM (PostgreSQL/MySQL/SQLite)"
                    elif any("mongoose" in d or "mongodb" in d for d in deps):
                        database_detected = "MongoDB"
                    elif any("pg" in d or "typeorm" in d or "sequelize" in d for d in deps):
                        database_detected = "PostgreSQL"
                    elif any("mysql" in d for d in deps):
                        database_detected = "MySQL"
                    elif any("redis" in d or "ioredis" in d for d in deps):
                        database_detected = "Redis"
            except Exception:
                pass

        # 2. Check Python (FastAPI, Flask, Django, Streamlit)
        elif os.path.exists(requirements_path) or any(f.endswith(".py") for f in files_found):
            detected_language = "Python 3"
            detected_package_manager = "pip"
            req_content = ""
            if os.path.exists(requirements_path):
                try:
                    with open(requirements_path, "r", encoding="utf-8") as f:
                        req_content = f.read().lower()
                        dependencies = [line.strip().split("==")[0] for line in req_content.splitlines() if line.strip() and not line.startswith("#")][:25]
                except Exception:
                    pass

            if "fastapi" in req_content or any("fastapi" in f for f in files_found):
                detected_framework = "FastAPI"
                build_command = "pip install -r requirements.txt"
                start_command = "uvicorn main:app --host 0.0.0.0 --port $PORT"
                output_dir = ""
                port = 8000
            elif "flask" in req_content:
                detected_framework = "Flask"
                build_command = "pip install -r requirements.txt"
                start_command = "gunicorn app:app --bind 0.0.0.0:$PORT"
                output_dir = ""
                port = 5000
            elif "django" in req_content:
                detected_framework = "Django"
                build_command = "pip install -r requirements.txt && python manage.py collectstatic --noinput"
                start_command = "gunicorn core.wsgi --bind 0.0.0.0:$PORT"
                output_dir = "staticfiles"
                port = 8000
            elif "streamlit" in req_content:
                detected_framework = "Streamlit"
                build_command = "pip install -r requirements.txt"
                start_command = "streamlit run app.py --server.port $PORT --server.address 0.0.0.0"
                output_dir = ""
                port = 8501
            else:
                detected_framework = "Python Script/App"
                build_command = "pip install -r requirements.txt" if os.path.exists(requirements_path) else ""
                start_command = "python main.py" if "main.py" in files_found else "python app.py"
                output_dir = ""
                port = 8000

            # DB checks in Python
            if "psycopg2" in req_content or "asyncpg" in req_content:
                database_detected = "PostgreSQL"
            elif "pymongo" in req_content or "motor" in req_content:
                database_detected = "MongoDB"
            elif "redis" in req_content:
                database_detected = "Redis"
            elif "sqlite" in req_content or any(f.endswith(".db") or f.endswith(".sqlite") or f.endswith(".sqlite3") for f in files_found):
                database_detected = "SQLite"

        # 3. Check Java Spring Boot
        elif os.path.exists(pom_xml_path) or os.path.exists(gradle_path):
            detected_language = "Java"
            detected_framework = "Spring Boot"
            if os.path.exists(pom_xml_path):
                detected_package_manager = "Maven"
                build_command = "mvn clean package -DskipTests"
                start_command = "java -jar target/*.jar"
            else:
                detected_package_manager = "Gradle"
                build_command = "./gradlew build -x test"
                start_command = "java -jar build/libs/*.jar"
            output_dir = "target"
            port = 8080

        # 4. Check for bare Java files (no build system)
        elif has_java_files:
            detected_language = "Java"
            detected_framework = "Java Application"
            detected_package_manager = "javac"
            build_command = "javac *.java"
            start_command = "java Main"
            output_dir = "."
            port = 8080

        # 5. Check for bare Python files (no requirements.txt)
        elif has_python_files:
            detected_language = "Python"
            detected_framework = "Python Application"
            detected_package_manager = "python"
            build_command = ""
            start_command = "python main.py" if "main.py" in files_found else "python app.py"
            output_dir = "."
            port = 8000

        # 6. Check for bare Go files (no go.mod)
        elif has_go_files:
            detected_language = "Go"
            detected_framework = "Go Application"
            detected_package_manager = "go"
            build_command = "go build -o app ."
            start_command = "./app"
            output_dir = "."
            port = 8080

        # 7. Check for bare C# files (no .csproj)
        elif has_cs_files:
            detected_language = "C#"
            detected_framework = ".NET Application"
            detected_package_manager = "dotnet"
            build_command = "dotnet build"
            start_command = "dotnet run"
            output_dir = "."
            port = 5000

        # 8. Check for bare PHP files
        elif has_php_files:
            detected_language = "PHP"
            detected_framework = "PHP Application"
            detected_package_manager = "composer"
            build_command = ""
            start_command = "php -S 0.0.0.0:8000"
            output_dir = "."
            port = 8000

        # 9. Check for bare Ruby files
        elif has_ruby_files:
            detected_language = "Ruby"
            detected_framework = "Ruby Application"
            detected_package_manager = "bundler"
            build_command = "bundle install"
            start_command = "ruby app.rb"
            output_dir = "."
            port = 3000

        # 10. Check Dockerfile
        if os.path.exists(dockerfile_path):
            if detected_framework in ["Static Web", "Unknown"]:
                detected_framework = "Docker Container"
            build_command = build_command or "docker build -t app ."
            start_command = start_command or "docker run -p 8080:8080 app"

        # 5. Check static HTML/CSS/JS if still static web
        if detected_framework == "Static Web":
            if "index.html" in files_found:
                detected_framework = "HTML5 / JavaScript Static Site"
                detected_language = "HTML/CSS/JS"
                build_command = ""
                start_command = "Static Hosting"
                output_dir = "."
                port = 80

        # 6. Extract environment variables hints from .env.example or source
        env_files = [".env.example", ".env.sample", ".env.template", ".env.local"]
        for env_file in env_files:
            env_path = os.path.join(root_dir, env_file)
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                var_name = line.split("=")[0].strip()
                                if var_name and var_name not in env_vars_detected:
                                    env_vars_detected.append(var_name)
                except Exception:
                    pass

        # Scan code files for common env references
        if not env_vars_detected:
            env_candidates = set()
            for root, dirs, files in os.walk(root_dir):
                dirs[:] = [d for d in dirs if d not in IGNORE_PATTERNS]
                for file_name in files:
                    if file_name.endswith(('.js', '.ts', '.jsx', '.tsx', '.py')):
                        file_full = os.path.join(root, file_name)
                        try:
                            with open(file_full, "r", encoding="utf-8", errors="ignore") as f:
                                content = f.read(10000)
                                # process.env.XYZ or os.environ.get("XYZ")
                                found_js = re.findall(r'process\.env\.([A-Z0-9_]{3,30})', content)
                                found_py = re.findall(r'os\.environ(?:\.get)?\([\'"]([A-Z0-9_]{3,30})[\'"]', content)
                                env_candidates.update(found_js)
                                env_candidates.update(found_py)
                        except Exception:
                            pass
            # Filter non-system vars
            env_vars_detected = [v for v in sorted(list(env_candidates)) if v not in ("NODE_ENV", "PORT")][:10]

        return {
            "framework": detected_framework,
            "language": detected_language,
            "package_manager": detected_package_manager,
            "build_command": build_command,
            "start_command": start_command,
            "output_dir": output_dir,
            "port": port,
            "database_detected": database_detected,
            "dependencies": dependencies,
            "env_variables_detected": env_vars_detected
        }
