import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialogProvider, useConfirm } from '../../components/ConfirmDialog';

const TestComponent = () => {
    const { confirm } = useConfirm();
    
    const handleClick = async () => {
        await confirm({
            title: 'Test Title',
            message: 'Test Message',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            confirmVariant: 'danger',
        });
    };
    
    return (
        <button onClick={handleClick}>Open Confirm</button>
    );
};

describe('ConfirmDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('renders children without showing dialog', () => {
        render(
            <ConfirmDialogProvider>
                <TestComponent />
            </ConfirmDialogProvider>
        );
        
        expect(screen.getByText('Open Confirm')).toBeInTheDocument();
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });
    
    it('opens dialog when confirm is called', async () => {
        render(
            <ConfirmDialogProvider>
                <TestComponent />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open Confirm'));
        
        await waitFor(() => {
            expect(screen.getByText('Test Title')).toBeInTheDocument();
            expect(screen.getByText('Test Message')).toBeInTheDocument();
        });
    });
    
    it('shows custom cancel text when provided', async () => {
        render(
            <ConfirmDialogProvider>
                <TestComponent />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open Confirm'));
        
        await waitFor(() => {
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });
    });
    
    it('returns confirmed false when cancel is clicked', async () => {
        let result: { confirmed: boolean; value?: string } | null = null;
        
        const TestComponentResult = () => {
            const { confirm } = useConfirm();
            
            const handleClick = async () => {
                result = await confirm({
                    title: 'Title',
                    message: 'Message',
                });
            };
            
            return <button onClick={handleClick}>Open</button>;
        };
        
        render(
            <ConfirmDialogProvider>
                <TestComponentResult />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open'));
        
        await waitFor(() => {
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('Cancelar'));
        
        await waitFor(() => {
            expect(result).toEqual({ confirmed: false });
        });
    });
    
    it('returns confirmed true when confirm is clicked', async () => {
        let result: { confirmed: boolean; value?: string } | null = null;
        
        const TestComponentResult = () => {
            const { confirm } = useConfirm();
            
            const handleClick = async () => {
                result = await confirm({
                    title: 'Title',
                    message: 'Message',
                });
            };
            
            return <button onClick={handleClick}>Open</button>;
        };
        
        render(
            <ConfirmDialogProvider>
                <TestComponentResult />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open'));
        
        await waitFor(() => {
            expect(screen.getByText('Confirmar')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('Confirmar'));
        
        await waitFor(() => {
            expect(result?.confirmed).toBe(true);
        });
    });
    
    it('shows input field when showInput is true', async () => {
        const TestComponentInput = () => {
            const { confirm } = useConfirm();
            
            const handleClick = async () => {
                await confirm({
                    title: 'Title',
                    message: 'Message',
                    showInput: true,
                    inputPlaceholder: 'Enter value',
                });
            };
            
            return <button onClick={handleClick}>Open</button>;
        };
        
        render(
            <ConfirmDialogProvider>
                <TestComponentInput />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open'));
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
        });
    });
    
    it('throws error when useConfirm is used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
            render(<TestComponent />);
        }).toThrow('useConfirm must be used within ConfirmDialogProvider');
        
        consoleError.mockRestore();
    });
    
    it('uses default values when options are not provided', async () => {
        const TestComponentDefault = () => {
            const { confirm } = useConfirm();
            
            const handleClick = async () => {
                await confirm({
                    title: 'Title',
                    message: 'Message',
                });
            };
            
            return <button onClick={handleClick}>Open</button>;
        };
        
        render(
            <ConfirmDialogProvider>
                <TestComponentDefault />
            </ConfirmDialogProvider>
        );
        
        fireEvent.click(screen.getByText('Open'));
        
        await waitFor(() => {
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
            expect(screen.getByText('Confirmar')).toBeInTheDocument();
        });
    });
});
