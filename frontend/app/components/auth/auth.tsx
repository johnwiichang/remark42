import { h, Fragment, FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import { useDispatch } from 'react-redux';

import { setUser } from 'store/user/actions';
import { Input } from 'components/input';
import TextareaAutosize from 'components/textarea-autosize';

import Button from './components/button';
import OAuthProviders from './components/oauth';
import messages from './auth.messsages';
import { useDropdown } from './auth.hooks';
import { getProviders, getTokenInvalidReason } from './auth.utils';
import { emailSignin, verifyEmailSignin, anonymousSignin } from './auth.api';

import styles from './auth.module.css';

const Auth: FunctionComponent = () => {
  const intl = useIntl();
  const dispath = useDispatch();
  const [oauthProviders, formProviders] = getProviders();

  // UI State
  const [isLoading, setLoading] = useState(false);
  const [view, setView] = useState<typeof formProviders[number] | 'token'>(formProviders[0]);
  const [ref, isDropdownShowed, toggleDropdownState] = useDropdown(view === 'token');

  // Errors
  const [invalidReason, setInvalidReason] = useState<keyof typeof messages | null>(null);

  const handleClickSingIn = (evt: Event) => {
    evt.preventDefault();
    toggleDropdownState();
  };

  const handleDropdownClose = (evt: Event) => {
    evt.preventDefault();
    setView(formProviders[0]);
    toggleDropdownState();
  };

  const handleProviderChange = (evt: Event) => {
    const { value } = evt.currentTarget as HTMLInputElement;

    setInvalidReason(null);
    setView(value as typeof formProviders[number]);
  };

  const handleSubmit = async (evt: Event) => {
    const data = new FormData(evt.target as HTMLFormElement);

    evt.preventDefault();
    setLoading(true);
    setInvalidReason(null);

    try {
      switch (view) {
        case 'anonymous': {
          const username = data.get('username') as string;
          const user = await anonymousSignin(username);

          dispath(setUser(user));
          break;
        }
        case 'email': {
          const email = data.get('email') as string;
          const username = data.get('username') as string;

          await emailSignin(email, username);
          setView('token');
          break;
        }
        case 'token': {
          const token = data.get('token') as string;
          const invalidReason = getTokenInvalidReason(token);

          if (invalidReason) {
            setInvalidReason(invalidReason);
          } else {
            const user = await verifyEmailSignin(token);
            dispath(setUser(user));
          }

          break;
        }
      }
    } catch (e) {
      setInvalidReason(e.message || e.error);
    }

    setLoading(false);
  };

  const handleShowEmailStep = (evt: Event) => {
    evt.preventDefault();
    setView('email');
  };

  const hasOAuthProviders = oauthProviders.length > 0;
  const hasFormProviders = formProviders.length > 0;
  const errorMessage =
    invalidReason !== null && invalidReason in messages ? intl.formatMessage(messages[invalidReason]) : invalidReason;
  const isTokenView = view === 'token';
  const submitButton = (
    <Button className="auth-submit" type="submit" disabled={isLoading}>
      {isLoading ? (
        <div
          className={cn('spinner', styles.spinner)}
          role="presentation"
          aria-label={intl.formatMessage(messages.loading)}
        />
      ) : (
        intl.formatMessage(isTokenView ? messages.signin : messages.submit)
      )}
    </Button>
  );

  return (
    <div className={cn('auth', styles.root)}>
      <Button
        className="auth-button"
        selected={isDropdownShowed}
        onClick={handleClickSingIn}
        suffix={
          <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 11.5L14.5 19L22 11"
              stroke="currentColor"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        }
      >
        {intl.formatMessage(messages.signin)}
      </Button>
      {isDropdownShowed && (
        <div className={cn('auth-dropdown', styles.dropdown)} ref={ref}>
          <form className={cn('auth-form', styles.form)} onSubmit={handleSubmit}>
            {isTokenView ? (
              <>
                <div className={cn('auth-row', styles.row)}>
                  <div className={styles.backButton}>
                    <Button className="auth-back-button" size="small" kind="transparent" onClick={handleShowEmailStep}>
                      <svg
                        className={styles.backButtonArrow}
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.75 3L5 7.25L9 11"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      {intl.formatMessage(messages.back)}
                    </Button>
                  </div>
                  <button
                    className={cn('auth-close-button', styles.closeButton)}
                    title="Close sign-in dropdown"
                    onClick={handleDropdownClose}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M2 2L12 12M12 2L2 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className={cn('auth-row', styles.row)}>
                  <TextareaAutosize
                    name="token"
                    className={cn('auth-token-textatea', styles.textarea)}
                    placeholder={intl.formatMessage(messages.token)}
                    disabled={isLoading}
                  />
                </div>
                <Button className="auth-submit" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div
                      className={cn('spinner', styles.spinner)}
                      role="presentation"
                      aria-label={intl.formatMessage(messages.loading)}
                    />
                  ) : (
                    intl.formatMessage(messages.submit)
                  )}
                </Button>
              </>
            ) : (
              <>
                {hasOAuthProviders && (
                  <>
                    <h5 className={cn('auth-form-title', styles.title)}>{intl.formatMessage(messages.oauthSource)}</h5>
                    <OAuthProviders providers={oauthProviders} />
                  </>
                )}
                {hasOAuthProviders && hasFormProviders && (
                  <div className={cn('auth-divider', styles.divider)} title={intl.formatMessage(messages.or)} />
                )}
                {hasFormProviders && (
                  <>
                    {formProviders.length === 1 ? (
                      <h5 className={cn('auth-form-title', styles.title)}>{formProviders[0]}</h5>
                    ) : (
                      <div className={cn('auth-tabs', styles.tabs)}>
                        {formProviders.map((p) => (
                          <Fragment key={p}>
                            <input
                              className={styles.radio}
                              type="radio"
                              id={`form-provider-${p}`}
                              name="form-provider"
                              value={p}
                              onChange={handleProviderChange}
                              checked={p === view}
                            />
                            <label className={cn('auth-tabs-item', styles.provider)} htmlFor={`form-provider-${p}`}>
                              {p.slice(0, 6)}
                            </label>
                          </Fragment>
                        ))}
                      </div>
                    )}

                    <div className={cn('auth-row', styles.row)}>
                      <Input
                        className="auth-input-username"
                        required
                        name="username"
                        minLength={3}
                        pattern="^[\p{L}\d_]+$"
                        title={intl.formatMessage(messages.usernameRestriction)}
                        placeholder={intl.formatMessage(messages.username)}
                        disabled={isLoading}
                      />
                    </div>
                    {view === 'email' && (
                      <div className={cn('auth-row', styles.row)}>
                        <Input
                          className="auth-input-email"
                          required
                          name="email"
                          type="email"
                          placeholder={intl.formatMessage(messages.emailAddress)}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    <input className={styles.honeypot} type="checkbox" tabIndex={-1} autoComplete="off" />
                    {errorMessage && <div className={cn('auth-error', styles.error)}>{errorMessage}</div>}
                    {submitButton}
                  </>
                )}
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Auth;
