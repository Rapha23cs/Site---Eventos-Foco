import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { Login } from './Login';
import { UserDashboard } from './UserDashboard';
import { AdminDashboard } from './AdminDashboard';
import { EventDetails } from './EventDetails';
import { PaymentCheckout } from './PaymentCheckout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/checkout/:id" element={<PaymentCheckout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
