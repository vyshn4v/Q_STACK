import React from 'react';
import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { RightRail } from './RightRail';
import { AuthModal } from '../auth/AuthModal';

interface AppShellProps {
  children: ReactNode;
  showRightRail?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showRightRail = true }) => {
  return (
    <div style={styles.page}>
      <AppHeader />
      <div style={styles.mainContainer}>
        <SidebarNavigation />
        <main style={styles.contentArea}>{children}</main>
        {showRightRail && <RightRail />}
      </div>
      <AuthModal />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
  },
  mainContainer: {
    maxWidth: '1360px',
    width: '100%',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    gap: '2rem',
    flexGrow: 1,
  },
  contentArea: {
    flexGrow: 1,
    minWidth: 0,
  },
};
