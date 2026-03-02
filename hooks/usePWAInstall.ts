import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed (running as standalone PWA)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check if user already dismissed this session
        const dismissed = sessionStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            setIsDismissed(true);
        }

        // Capture the install prompt event
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const promptInstall = async (): Promise<boolean> => {
        if (!installPrompt) return false;

        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            setInstallPrompt(null);
            return true;
        }
        return false;
    };

    const dismiss = () => {
        sessionStorage.setItem('pwa_install_dismissed', '1');
        setIsDismissed(true);
    };

    const canInstall = !!installPrompt && !isInstalled && !isDismissed;

    return { canInstall, isInstalled, promptInstall, dismiss };
};
