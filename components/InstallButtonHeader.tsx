import React from 'react';
import { useAuth } from './Auth';
import { InstallIcon } from './icons';

/**
 * A button that appears in the header to prompt PWA installation.
 * It automatically hides if installation is not available.
 */
export const InstallButtonHeader: React.FC = () => {
    const { canInstall, triggerInstallPrompt } = useAuth();

    if (!canInstall) {
        return null;
    }

    return (
        <button
            onClick={triggerInstallPrompt}
            className="flex items-center gap-2 font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 px-3 py-1.5 rounded-md transition-colors shadow-sm"
            aria-label="Instalar Aplicativo"
        >
            <InstallIcon className="w-4 h-4" />
            <span>Instalar App</span>
        </button>
    );
};