import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should not update value before delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        expect(result.current).toBe('initial');

        rerender({ value: 'updated', delay: 500 });

        // Before delay, should still be initial value
        expect(result.current).toBe('initial');
    });

    it('should update value after delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        expect(result.current).toBe('initial');

        rerender({ value: 'updated', delay: 500 });

        // Advance timers past the delay
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });

    it('should reset timer when value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'first', delay: 500 });
        
        act(() => {
            vi.advanceTimersByTime(300);
        });
        
        expect(result.current).toBe('initial');

        // Change value again before delay completes
        rerender({ value: 'second', delay: 500 });
        
        act(() => {
            vi.advanceTimersByTime(300);
        });
        
        // Should still be initial because timer was reset
        expect(result.current).toBe('initial');

        // Now advance past the second change delay
        act(() => {
            vi.advanceTimersByTime(200);
        });
        
        expect(result.current).toBe('second');
    });

    it('should handle different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 1000 } }
        );

        rerender({ value: 'updated', delay: 1000 });

        // Advance only 500ms (half the delay)
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('initial');

        // Advance remaining time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });
});
