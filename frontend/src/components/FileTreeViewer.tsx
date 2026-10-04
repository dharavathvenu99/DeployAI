import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileCode, FileText, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileNode } from '../types';

interface FileTreeViewerProps {
  nodes: FileNode[];
}

const FileItem: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFolder = node.type === 'folder';

  const getFileIcon = useMemo(() => {
    const ext = node.name.split('.').pop()?.toLowerCase();
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) return <FileText className="w-3.5 h-3.5 text-warning shrink-0" />;
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />;
    if (['py'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-warning shrink-0" />;
    if (['css', 'html'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-error shrink-0" />;
    if (node.name.includes('docker')) return <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />;
    return <File className="w-3.5 h-3.5 text-text-muted shrink-0" />;
  }, [node.name]);

  const isImportantFile = node.name === 'package.json' || node.name === 'requirements.txt' || node.name === 'Dockerfile';

  return (
    <div className="select-none text-xs" role={isFolder ? 'treeitem' : undefined} aria-expanded={isOpen} aria-level={depth + 1}>
      <button
        onClick={() => isFolder && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 14}px` }}
        className={`w-full flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-surface transition-colors text-left ${
          isImportantFile
            ? 'text-primary font-semibold bg-primary-bg/50'
            : 'text-text-secondary'
        }`}
        aria-label={isFolder ? `${isOpen ? 'Collapse' : 'Expand'} ${node.name}` : node.name}
      >
        {isFolder ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
            {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" /> : <Folder className="w-3.5 h-3.5 text-primary shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {getFileIcon}
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.size && (
          <span className="ml-auto text-[10px] text-text-muted font-mono">
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)} KB` : `${node.size} B`}
          </span>
        )}
      </button>

      {isFolder && isOpen && node.children && (
        <div role="group" aria-label={`${node.name} contents`}>
          {node.children.map((child, idx) => (
            <FileItem key={`${child.path}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreeViewer: React.FC<FileTreeViewerProps> = ({ nodes }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-text-muted" role="status">
        No files detected in repository
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-72 p-2 rounded-lg bg-surface border border-border font-mono" role="tree" aria-label="Project file tree">
      {nodes.map((node, idx) => (
        <FileItem key={`${node.path}-${idx}`} node={node} depth={0} />
      ))}
    </div>
  );
};