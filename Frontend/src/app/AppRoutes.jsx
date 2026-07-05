import React from 'react'
import { Routes , Route } from 'react-router'
import Login from '../features/auth/pages/Login'
import Register from '../features/auth/pages/Register'
import Dashboard from '../features/chat/pages/Dashboard'
import Protected from '../features/auth/components/protected'
import { Navigate } from 'react-router'

const AppRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<Protected><Dashboard/></Protected>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/dashboard' element={<Navigate to="/" replace/>} />
    </Routes>
  )
}

export default AppRoutes