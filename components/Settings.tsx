import React, { useState } from 'react';
import { SunIcon, MoonIcon, TrophyIcon, InstallIcon } from './icons';
import type { Currency, Achievement } from '../types';
import { useAuth } from './Auth';
import { ProfileModal } from './ProfileModal';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  achievements: Achievement[];
}

const SettingItem: React.FC<{ title: string; description: string; control: React.ReactNode }> = ({ title, description, control }) => (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {control}
    </div>
);


export const Settings: React.FC<SettingsProps> = ({ isDarkMode, toggleDarkMode, currency, setCurrency, achievements }) => {
  const { user, updateUserProfile, triggerInstallPrompt, canInstall } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const ThemeToggle = () => (
     <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-slate-300 dark:bg-slate-600"
      aria-label={`Mudar para modo ${isDarkMode ? 'claro' : 'escuro'}`}
    >
      <span
        className={`${
          isDarkMode ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform flex items-center justify-center`}
      >
        {isDarkMode ? <MoonIcon className="w-3 h-3 text-slate-800"/> : <SunIcon className="w-3 h-3 text-slate-800"/>}
      </span>
    </button>
  );

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <h3 className="text-xl font-semibold p-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Preferências da Empresa</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <SettingItem title="Modo Escuro" description="Ative para uma experiência visual mais confortável à noite." control={<ThemeToggle />} />
            <SettingItem 
                title="Moeda" 
                description="Selecione a moeda padrão para as operações da empresa." 
                control={
                    <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                        <option value="BRL">BRL (R$)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                } 
            />
            {canInstall && (
               <SettingItem 
                    title="Instalar Aplicativo" 
                    description="Acesso rápido e offline, como um app nativo." 
                    control={
                        <button 
                            onClick={triggerInstallPrompt} 
                            className="flex items-center gap-2 font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 px-3 py-1.5 rounded-md"
                        >
                            <InstallIcon className="w-4 h-4"/>
                            Instalar
                        </button>
                    }
                />
            )}
        </div>
      </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <h3 className="text-xl font-semibold p-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Usuário e Empresa</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
             <SettingItem 
                title="Perfil e Empresa" 
                description="Altere seu nome, e-mail e nome da empresa." 
                control={<button onClick={() => setShowProfileModal(true)} className="font-semibold text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">Editar</button>}
            />
             <SettingItem 
                title="Senha" 
                description="Altere sua senha de acesso." 
                control={<button onClick={() => setShowPasswordModal(true)} className="font-semibold text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">Alterar</button>}
            />
        </div>
      </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold p-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Marcos da Empresa</h3>
        {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {unlockedAchievements.map(ach => (
                    <div key={ach.id} className="flex flex-col items-center text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <ach.icon className="w-10 h-10 text-yellow-500 mb-2" />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{ach.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                <TrophyIcon className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>A jornada da sua empresa está apenas começando!</p>
                <p className="text-sm">Continue usando o app para desbloquear novas conquistas.</p>
            </div>
        )}
      </div>

      {showProfileModal && user && (
        <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onSave={updateUserProfile}
        />
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">Alterar Senha</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Esta funcionalidade ainda não foi implementada.</p>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};