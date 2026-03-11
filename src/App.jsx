import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import MotoLayout from './MotoLayout.jsx';
import Home from '../Pages/Home';
import Shop from '../Pages/Shop';
import LooksCatalog from '../Pages/LooksCatalog';
import Checkout from '../Pages/Checkout';
import OrderStatus from '../Pages/OrderStatus';
import Admin from '../Pages/Admin';
import ReadySet from '../Pages/ReadySet';
import About from '../Pages/About';
import Contacts from '../Pages/Contacts';
import ProductDetails from '../Pages/ProductDetails';
import { createPageUrl } from './utils.js';
import ScrollToTop from './components/ScrollToTop.jsx';
import { MotoStoreProvider } from './data/motoStore.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 0,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path={createPageUrl('Home')} element={<Home />} />
      <Route path={createPageUrl('Shop')} element={<Shop />} />
      <Route path={createPageUrl('LooksCatalog')} element={<LooksCatalog />} />
      <Route path={createPageUrl('Cart')} element={<Navigate to={createPageUrl('Shop')} replace />} />
      <Route path={createPageUrl('Checkout')} element={<Checkout />} />
      <Route path={createPageUrl('OrderStatus')} element={<OrderStatus />} />
      <Route path={`${createPageUrl('ReadySet')}/:slug`} element={<ReadySet />} />
      <Route path={createPageUrl('About')} element={<About />} />
      <Route path={createPageUrl('Contacts')} element={<Contacts />} />
      <Route path={`${createPageUrl('ProductDetails')}/:slug`} element={<ProductDetails />} />
      <Route path="*" element={<Navigate to={createPageUrl('Home')} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotoStoreProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <MotoLayout>
            <AppRoutes />
          </MotoLayout>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </MotoStoreProvider>
    </QueryClientProvider>
  );
}

export default App;

