"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/i18n/TranslationProvider';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [errorType, setErrorType] = useState<string>('');
  const hasVerifiedRef = useRef(false); // Guard to prevent duplicate API calls
  const toast = useRef<Toast>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    // Prevent duplicate calls
    if (hasVerifiedRef.current) {
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorType('missing_token');
      setMessage(t('Verification token is missing'));
      // Don't auto-redirect, let user choose
      return;
    }

    // Mark as verifying to prevent duplicate calls
    hasVerifiedRef.current = true;

    // Call the API to verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(t('Email verified successfully! Redirecting to login...'));
          setTimeout(() => {
            router.push('/auth/login?message=email_verified');
          }, 2000);
        } else if (data.message === 'already_verified') {
          setStatus('success');
          setMessage(t('Email is already verified. Redirecting to login...'));
          setTimeout(() => {
            router.push('/auth/login?message=already_verified');
          }, 2000);
        } else {
          // Handle error responses
          setStatus('error');
          setErrorType(data.error || 'verification_failed');
          if (data.error === 'invalid_or_expired_token') {
            setMessage(t('Invalid or expired verification token. Please request a new verification email.'));
            setShowResendForm(true); // Show resend form for expired tokens
          } else if (data.error === 'missing_token') {
            setMessage(t('Verification token is missing'));
            // Don't auto-redirect, let user choose
          } else {
            setMessage(data.message || t('Verification failed. Please try again.'));
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setErrorType('verification_failed');
        setMessage(t('An error occurred during verification'));
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - ref guard prevents duplicate calls, token is read from URL on mount

  const handleResendVerification = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      toast.current?.show({
        severity: 'error',
        summary: t('Invalid Email'),
        detail: t('Please enter a valid email address'),
        life: 3000
      });
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: t('Email Sent'),
          detail: data.message || t('Verification email has been sent. Please check your inbox.'),
          life: 5000
        });
        setShowResendForm(false);
        setResendEmail('');
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t('Error'),
          detail: data.error || t('Failed to send verification email. Please try again.'),
          life: 5000
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.current?.show({
        severity: 'error',
        summary: t('Error'),
        detail: t('Failed to send verification email. Please try again.'),
        life: 5000
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FDFCF9',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <Toast ref={toast} />
        {status === 'verifying' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem', color: '#1e3a5f' }}></i>
            </div>
            <h1 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>{t('Verifying Email...')}</h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              {t('Please wait while we verify your email address.')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <i className="pi pi-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
            </div>
            <h1 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>{t('Email Verified!')}</h1>
            <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>
              {message || t('Your email has been successfully verified. You can now log in to your account.')}
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                backgroundColor: '#1e3a5f',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t('Go to Login')}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <i className="pi pi-times-circle" style={{ fontSize: '3rem', color: '#ef4444' }}></i>
            </div>
            <h1 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>{t('Verification Failed')}</h1>
            <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>
              {message || t('The verification link is invalid or has expired.')}
            </p>

            {showResendForm && (
              <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <p style={{ 
                  color: '#666', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  {t('Enter your email address to receive a new verification link')}
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <InputText
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('Enter your email address')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '1rem'
                    }}
                    disabled={resending}
                    onKeyPress={(e) => e.key === 'Enter' && handleResendVerification()}
                  />
                </div>
                <Button
                  label={resending ? t('Sending...') : t('Resend Verification Email')}
                  icon={resending ? 'pi pi-spinner pi-spin' : 'pi pi-send'}
                  onClick={handleResendVerification}
                  disabled={resending || !resendEmail}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e3a5f',
                    border: 'none',
                    padding: '0.75rem'
                  }}
                />
              </div>
            )}

            {!showResendForm && (
              <button
                onClick={() => setShowResendForm(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#1e3a5f',
                  border: '1px solid #1e3a5f',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {t('Resend Verification Email')}
              </button>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => router.push('/auth/login')}
                style={{
                  backgroundColor: '#1e3a5f',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t('Go to Login')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#FDFCF9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem', color: '#1e3a5f' }}></i>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

