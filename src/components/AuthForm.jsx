"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, University, ArrowRight, Loader2, Home, UserCircle } from 'lucide-react';
import { signIn, signUp } from '../utils/authHelpers';

const AuthForm = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('student'); // 'student' or 'owner'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        university: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signIn(formData.email, formData.password);
                window.location.href = '/app';
            } else {
                await signUp(formData.email, formData.password, role, formData);
                window.location.href = '/app';
            }
        } catch (err) {
            setError(err.message || 'Error al procesar la solicitud');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-text-main/60 backdrop-blur-md"
                />

                {/* Form Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[500px] bg-white rounded-4xl shadow-2xl overflow-hidden border border-slate-100"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>

                    <div className="p-8 sm:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black tracking-tighter text-text-main mb-3">
                                {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                            </h2>
                            <p className="text-text-muted font-medium">
                                {isLogin ? 'Encuentra tu próximo hogar hoy mismo' : 'Únete a la comunidad de RentAI'}
                            </p>
                        </div>

                        {/* Login/Signup Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                            >
                                Registrarse
                            </button>
                        </div>

                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <button
                                    onClick={() => setRole('student')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'student' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/20'}`}
                                >
                                    <UserCircle className={`w-6 h-6 ${role === 'student' ? 'text-primary' : 'text-text-muted'}`} />
                                    <span className={`text-[12px] font-black uppercase tracking-wider ${role === 'student' ? 'text-primary' : 'text-text-muted'}`}>Estudiante</span>
                                </button>
                                <button
                                    onClick={() => setRole('owner')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'owner' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/20'}`}
                                >
                                    <Home className={`w-6 h-6 ${role === 'owner' ? 'text-primary' : 'text-text-muted'}`} />
                                    <span className={`text-[12px] font-black uppercase tracking-wider ${role === 'owner' ? 'text-primary' : 'text-text-muted'}`}>Propietario</span>
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Nombre</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="Juan"
                                            />
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Apellido</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Pérez"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="tu@email.com"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Teléfono</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="+57 300 123 4567"
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            {!isLogin && role === 'student' && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Universidad</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="university"
                                            value={formData.university}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Nombre de tu U"
                                        />
                                        <University className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[12px] font-black uppercase tracking-widest text-text-muted ml-1">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="********"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-[13px] font-bold text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:opacity-90 text-white py-5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-6"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'ENTRAR' : 'CREAR CUENTA'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuthForm;
