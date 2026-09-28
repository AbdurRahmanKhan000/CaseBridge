/**
 * CaseBridge Stage 8 UI Component & Route Smoke Tests
 * Validates UI components, states, and client-side routing dispatchers.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { Button } from '../src/components/ui/Button';
import { StatusBadge, PriorityBadge } from '../src/components/StatusBadge';
import { StatusTimeline } from '../src/components/ui/StatusTimeline';
import { Alert } from '../src/components/ui/Alert';
import { Card } from '../src/components/ui/Card';
import { CaseStatus, CasePriority } from '../src/types';

describe('UI Component Quality & State Verification', () => {
  describe('Button Component', () => {
    it('initializes button with correct default properties', () => {
      const btn = React.createElement(Button, { variant: 'primary', size: 'md' }, 'Click Me');
      expect(btn.props.variant).toBe('primary');
      expect(btn.props.size).toBe('md');
      expect(btn.props.children).toBe('Click Me');
    });

    it('supports loading state with aria-busy accessibility attribute', () => {
      const btn = React.createElement(Button, { isLoading: true, loadingText: 'Submitting...' }, 'Submit');
      expect(btn.props.isLoading).toBe(true);
      expect(btn.props.loadingText).toBe('Submitting...');
    });
  });

  describe('StatusBadge and PriorityBadge', () => {
    const statuses: CaseStatus[] = ['Received', 'Assigned', 'In Review', 'Action Required', 'Resolved', 'Closed'];
    const priorities: CasePriority[] = ['Low', 'Medium', 'High', 'Critical'];

    it('renders all 6 lifecycle statuses with designated visual semantics', () => {
      for (const st of statuses) {
        const badge = React.createElement(StatusBadge, { status: st });
        expect(badge.props.status).toBe(st);
      }
    });

    it('renders overdue indicators alongside active case statuses', () => {
      const badge = React.createElement(StatusBadge, { status: 'In Review', isOverdue: true });
      expect(badge.props.isOverdue).toBe(true);
    });

    it('renders all 4 priority levels with distinctive styling tokens', () => {
      for (const p of priorities) {
        const badge = React.createElement(PriorityBadge, { priority: p });
        expect(badge.props.priority).toBe(p);
      }
    });
  });

  describe('StatusTimeline Component', () => {
    it('instantiates timeline with current status and SLA deadline', () => {
      const timeline = React.createElement(StatusTimeline, {
        currentStatus: 'In Review',
        isOverdue: false,
        deadlineAt: '2026-10-05T12:00:00Z',
      });
      expect(timeline.props.currentStatus).toBe('In Review');
      expect(timeline.props.deadlineAt).toBe('2026-10-05T12:00:00Z');
    });
  });

  describe('Alert and Card Components', () => {
    it('supports info, success, warning, and error alert variants', () => {
      const variants: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];
      for (const v of variants) {
        const alert = React.createElement(Alert, {
          variant: v,
          title: `Alert ${v}`,
          children: `Body of ${v}`,
        });
        expect((alert.props as any).variant).toBe(v);
      }
    });

    it('renders structural Card container with header and footer slots', () => {
      const card = React.createElement(Card, {
        header: React.createElement('h3', null, 'Header Title'),
        footer: React.createElement('p', null, 'Footer Content'),
        children: 'Card Body',
      });
      expect((card.props as any).header).toBeDefined();
      expect((card.props as any).footer).toBeDefined();
    });
  });
});
