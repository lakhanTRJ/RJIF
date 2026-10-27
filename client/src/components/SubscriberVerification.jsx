import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function SubscriberVerification({ onChange, eventYear = 2027 }) {
  const [wants, setWants] = useState(false),
    [channel, setChannel] = useState('whatsapp');
  const [channels, setChannels] = useState({}),
    [contact, setContact] = useState(''),
    [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(''),
    [verified, setVerified] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [wait, setWait] = useState(0);
  useEffect(() => {
    api('/public/subscriber-verification/channels')
      .then((data) => {
        setChannels(data);
        if (!data.whatsapp && data.email) setChannel('email');
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    onChange({ claim: wants, verified: wants && verified, channel, contact });
  }, [wants, verified, channel, contact, onChange]);
  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const reset = () => {
    setVerified(false);
    setChallenge('');
    setCode('');
    setMessage('');
  };
  return (
    <section className="subscriber-benefit" aria-label="Magazine subscriber benefit">
      <div className="subscriber-benefit-header">
        <div className="subscriber-magazine-stack">
          <img
            className="subscriber-magazine-back"
            src="/reference/2026/09/subscriber-magazine-may-jun-2026.jpeg"
            alt="The Retail Jeweller India, May–June 2026 edition"
            width="768"
            height="1024"
            loading="lazy"
          />
          <img
            className="subscriber-magazine-front"
            src="/reference/2026/09/subscriber-magazine-jul-aug-2026.jpg"
            alt="The Retail Jeweller India, July–August 2026 edition"
            width="1484"
            height="2000"
            loading="lazy"
          />
        </div>
        <div className="subscriber-benefit-copy">
          <p className="subscriber-eyebrow">Subscriber exclusive benefit</p>
          <h2>
            5-year subscribers
            <br />
            get <strong>50% off</strong>
          </h2>
          <p>
            As a valued 5-year subscriber of The Retail Jeweller magazine, you are entitled to an exclusive
            50% discount on your registration fee for the Retail Jeweller Business Excellence Awards{' '}
            {eventYear}.
          </p>
          <small>
            Discount applies before GST. One discounted registration per company for {eventYear}, using either
            registered mobile. One registration fee covers your selected categories.
          </small>
        </div>
      </div>
      <div className="subscriber-verification-panel">
        <fieldset disabled={busy}>
          <legend>Are you a 5-year subscriber of The Retail Jeweller magazine?</legend>
          <label>
            <input
              type="radio"
              name="subscriber_choice"
              checked={wants}
              onChange={() => {
                reset();
                setWants(true);
              }}
            />{' '}
            Yes, I am a 5-year subscriber
          </label>
          <label>
            <input
              type="radio"
              name="subscriber_choice"
              checked={!wants}
              onChange={() => {
                reset();
                setWants(false);
              }}
            />{' '}
            No, I am not a 5-year subscriber
          </label>
        </fieldset>
        {wants && (
          <>
            <label>
              Verification method
              <select
                value={channel}
                disabled={busy || verified}
                onChange={(e) => {
                  setChannel(e.target.value);
                  reset();
                }}
              >
                <option value="whatsapp" disabled={!channels.whatsapp}>
                  WhatsApp{!channels.whatsapp ? ' (not configured yet)' : ''}
                </option>
                <option value="email" disabled={!channels.email}>
                  Email{!channels.email ? ' (not available)' : ''}
                </option>
              </select>
            </label>
            <label>
              {channel === 'email'
                ? 'Registered subscriber email'
                : 'Registered WhatsApp mobile (include country code)'}
              <input
                type={channel === 'email' ? 'email' : 'tel'}
                value={contact}
                disabled={busy || verified}
                autoComplete={channel === 'email' ? 'email' : 'tel'}
                onChange={(e) => {
                  setContact(e.target.value);
                  reset();
                }}
              />
            </label>
            {!verified && (
              <>
                <p>
                  By requesting a code, you agree to receive a one-time verification message on this
                  registered contact. Codes expire after 5 minutes.
                </p>
                <button
                  type="button"
                  className="ref-button"
                  disabled={busy || wait > 0 || !contact || !channels[channel]}
                  onClick={async () => {
                    setBusy(true);
                    setMessage('');
                    try {
                      const result = await api('/public/subscriber-verification/request', {
                        method: 'POST',
                        body: JSON.stringify({ channel, contact, consent: true }),
                      });
                      setChallenge(result.challengeId);
                      setWait(60);
                      setCode('');
                      setMessage(result.message);
                    } catch (e) {
                      setMessage(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy
                    ? 'Please wait…'
                    : wait
                      ? `Resend in ${wait}s`
                      : challenge
                        ? 'Resend code'
                        : 'Send verification code'}
                </button>
                {challenge && (
                  <div className="subscriber-code">
                    <label>
                      6-digit verification code
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </label>
                    <button
                      type="button"
                      className="ref-button"
                      disabled={busy || code.length !== 6}
                      onClick={async () => {
                        setBusy(true);
                        setMessage('');
                        try {
                          const result = await api('/public/subscriber-verification/verify', {
                            method: 'POST',
                            body: JSON.stringify({ challengeId: challenge, code }),
                          });
                          setVerified(result.verified);
                          setMessage(result.message);
                        } catch (e) {
                          setMessage(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Verify code
                    </button>
                  </div>
                )}
              </>
            )}
            {verified && (
              <button type="button" className="ref-button light" onClick={reset}>
                Change verified contact
              </button>
            )}
            <p>
              Use the same verified {channel === 'email' ? 'email' : 'mobile number'} in your application
              contact information.
            </p>
          </>
        )}
        {message && (
          <p role="status" className={verified ? 'subscriber-verified' : ''}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
