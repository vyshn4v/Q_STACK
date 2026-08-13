import React from 'react';
import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { RightRail } from './RightRail';
import { MobileNavigation } from './MobileNavigation';
import { AuthModal } from '../auth/AuthModal';

interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
  showRightRail?: boolean;
  maxWidth?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showSidebar = true,
  showRightRail = true,
  maxWidth = '1360px',
}) => {
  return (
    <div className="app-shell-page" style={styles.page}>
      <AppHeader />
      <div
        className="app-shell-main"
        style={{
          ...styles.mainContainer,
          maxWidth,
          justifyContent: showSidebar ? 'flex-start' : 'center',
        }}
      >
        {showSidebar && (
          <div className="app-shell-sidebar">
            <SidebarNavigation />
          </div>
        )}
        <main style={styles.contentArea}>{children}</main>
        {showSidebar && showRightRail && (
          <div className="app-shell-right-rail">
            <RightRail />
          </div>
        )}
      </div>
      <MobileNavigation />
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
    position: 'relative',
  },
  mainContainer: {
    width: '100%',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    gap: '2rem',
    flexGrow: 1,
    boxSizing: 'border-box',
  },
  contentArea: {
    flexGrow: 1,
    minWidth: 0,
    width: '100%',
  },
};
