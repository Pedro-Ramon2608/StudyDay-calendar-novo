import React, { useState } from 'react';
import { UsefulLink } from '../../types';
import { ExternalLink, Plus, Trash2, Link as LinkIcon, Globe } from 'lucide-react';
import { normalizeUrl } from '../../utils/dateUtils';
import { CatPawIcon } from '../Cat/CatIcon';

interface LinkManagerProps {
  links: UsefulLink[];
  onAddLink: (title: string, url: string) => void;
  onDeleteLink: (id: string) => void;
  title?: string;
  placeholderTitle?: string;
  placeholderUrl?: string;
  emptyMessage?: string;
  compact?: boolean;
}

export const LinkManager: React.FC<LinkManagerProps> = ({
  links,
  onAddLink,
  onDeleteLink,
  title = 'Links de Apoio & Materiais',
  placeholderTitle = 'Nome do material (ex.: Videoaula 04, Docs)',
  placeholderUrl = 'https://...',
  emptyMessage = 'Nenhum link adicionado ainda.',
  compact = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim()) {
      setError('Por favor, informe o título ou nome do link.');
      return;
    }
    if (!linkUrl.trim()) {
      setError('Por favor, informe a URL.');
      return;
    }
    const cleanUrl = normalizeUrl(linkUrl);
    try {
      new URL(cleanUrl);
    } catch {
      setError('URL inválida. Verifique o link digitado.');
      return;
    }

    onAddLink(linkTitle.trim(), cleanUrl);
    setLinkTitle('');
    setLinkUrl('');
    setError('');
    setIsAdding(false);
  };

  const getHostname = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{title}</span>
          <CatPawIcon size={12} color="#f472b6" />
          <span className="text-slate-400 font-mono tabular-nums">({links.length})</span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors py-1 px-2 rounded-md hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Link</span>
            <CatPawIcon size={11} color="#6366f1" />
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5">
          <div className="space-y-1">
            <label className="block text-slate-600 font-medium">Título do Recurso</label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => {
                setLinkTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder={placeholderTitle}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="block text-slate-600 font-medium">URL / Endereço Web</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder={placeholderUrl}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 font-mono text-[11px]"
            />
          </div>
          {error && <p className="text-rose-600 text-[11px]">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError('');
              }}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
            >
              Salvar Link
            </button>
          </div>
        </form>
      )}

      {links.length === 0 ? (
        <div className="p-2.5 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <span>{emptyMessage}</span>
          <CatPawIcon size={12} color="#cbd5e1" />
        </div>
      ) : (
        <div className={`space-y-1.5 ${compact ? 'text-xs' : ''}`}>
          {links.map((link) => {
            const host = getHostname(link.url);
            return (
              <div
                key={link.id}
                className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 flex-1 hover:text-indigo-600 transition-colors"
                  title={link.url}
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-800 truncate group-hover:text-indigo-700">
                      {link.title}
                    </div>
                    {host && (
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        {host}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-all ml-1" />
                </a>

                <button
                  type="button"
                  onClick={() => onDeleteLink(link.id)}
                  aria-label={`Excluir link ${link.title}`}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
