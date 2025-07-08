import React, { useState } from 'react';
import type { User } from '../types';
import { UserIcon } from './icons';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (data: { name: string; email: string; avatarUrl?: string; companyName?: string; }) => Promise<{ success: boolean; message?: string; }>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [companyName, setCompanyName] = useState(user.companyName || '');
    const [avatarFile, setAvatarFile] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('A imagem é muito grande. O limite é 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarFile(base64String);
                setAvatarPreview(base64String);
                setError('');
            };
            reader.onerror = () => {
                setError('Falha ao ler o arquivo de imagem.');
            }
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await onSave({
            name,
            email,
            companyName,
            avatarUrl: avatarFile || undefined, // only send if new file was selected
        });

        setIsLoading(false);
        if (result.success) {
            onClose();
        } else {
            setError(result.message || 'Ocorreu um erro desconhecido.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Perfil e Empresa</h2>
                    
                    <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-12 h-12 text-slate-500" />
                                </div>
                            )}
                            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                </svg>
                                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="companyName" className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome da Empresa</label>
                        <input id="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label htmlFor="name" className="text-sm font-medium text-slate-600 dark:text-slate-300">Seu Nome (Responsável)</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-300">Email de Acesso</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50">
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};