import React, { useState, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { checkGatewayHealth } from '../../services/gateway';

export const AppShell: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);
  const { pathname } = useLocation();
  const outlet = useOutlet({ setIsMobileOpen, gatewayOnline });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const isOnline = await checkGatewayHealth();
      if (isMounted) setGatewayOnline(isOnline);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="paper-canvas min-h-screen flex">
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} gatewayOnline={gatewayOnline} />
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <main className="flex-1 pb-12">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial="hidden"
                animate="visible"
                exit={{ opacity: reducedMotion ? 1 : 0, transition: { duration: reducedMotion ? 0 : 0.1 } }}
                variants={{
                  hidden: { opacity: reducedMotion ? 1 : 0 },
                  visible: { opacity: 1, transition: { duration: reducedMotion ? 0 : 0.2, staggerChildren: reducedMotion ? 0 : 0.025 } },
                }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
};
