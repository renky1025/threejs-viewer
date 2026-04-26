import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ModelPage from './pages/ModelPage';
import MaterialSphere from './pages/MaterialSphere';
import AppToast from './components/AppToast';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/model/:name" element={<ModelPage />} />
        <Route path="/material-sphere" element={<MaterialSphere />} />
      </Routes>
      <AppToast />
    </BrowserRouter>
  );
}
