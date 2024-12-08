import { App as Cap } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ToastProvider } from '@radix-ui/react-toast';
import { useReducedMotion } from '@react-spring/web';
import useGetState from 'api/getState';
import { AppStoreBanner } from 'components/AppStoreBanner';
import LoadingOverlay from 'components/LoadingOverlay';
import { useFeatureFlag } from 'features/feature-flags/api';
import Header from 'features/header/Header';
import UpdatePrompt from 'features/service-worker/UpdatePrompt';
import { useGetCanonicalUrl } from 'hooks/useGetCanonicalUrl';
import { useSetAtom } from 'jotai';
import { lazy, ReactElement, Suspense, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mode } from 'utils/constants';
import { productionConsumptionAtom } from 'utils/state/atoms';

const MapWrapper = lazy(async () => import('features/map/MapWrapper'));
const LeftPanel = lazy(async () => import('features/panels/LeftPanel'));

const isProduction = import.meta.env.PROD;

export default function App(): ReactElement {
  // Triggering the useReducedMotion hook here ensures the global animation settings are set as soon as possible
  useReducedMotion();

  // Triggering the useGetState hook here ensures that the app starts loading data as soon as possible
  // instead of waiting for the map to be lazy loaded.
  // TODO: Replace this with prefetching once we have latest endpoints available for all state aggregates
  useGetState();
  const { t, i18n } = useTranslation();
  const canonicalUrl = useGetCanonicalUrl();
  const setConsumptionAtom = useSetAtom(productionConsumptionAtom);
  const isConsumptionOnlyMode = useFeatureFlag('consumption-only');

  useEffect(() => {
    if (isConsumptionOnlyMode) {
      setConsumptionAtom(Mode.CONSUMPTION);
    }
  }, [isConsumptionOnlyMode, setConsumptionAtom]);

  // Handle back button on Android
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      Cap.addListener('backButton', () => {
        if (window.location.pathname === '/map') {
          Cap.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }, []);

  return (
    <Suspense fallback={<div />}>
      <main className="fixed flex h-full w-full flex-col">
        <AppStoreBanner />
        <ToastProvider duration={20_000}>
          <Suspense>
            <Header />
          </Suspense>
          <div className="relative flex flex-auto items-stretch">
            <Suspense>
              <UpdatePrompt />
            </Suspense>
            <Suspense>
              <LoadingOverlay />
            </Suspense>
            <Suspense>
              <LeftPanel />
            </Suspense>
            <Suspense>
              <MapWrapper />
            </Suspense>
          </div>
        </ToastProvider>
      </main>
    </Suspense>
  );
}
