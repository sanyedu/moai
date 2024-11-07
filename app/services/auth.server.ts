// app/services/auth.server.ts
import type { User } from '~/types/user'
import { Authenticator } from 'remix-auth'
import { sessionStorage } from '~/services/session.server'
import { CognitoOAuth2Strategy } from './cognito-oauth2-strategy'
import assert from 'assert'

const {
    DOMAIN,
    COGNITO_USER_POOL_DOMAIN,
    COGNITO_APP_CLIENT_ID = '',
    COGNITO_APP_CLIENT_SECRET = ''
} = process.env

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage)

const cognitoStrategy = new CognitoOAuth2Strategy<User>(
    {
        domain: COGNITO_USER_POOL_DOMAIN,
        clientId: COGNITO_APP_CLIENT_ID,
        clientSecret: COGNITO_APP_CLIENT_SECRET,
        redirectURI:
            process.env.NODE_ENV === 'production'
                ? `${DOMAIN}/auth/callback`
                : 'http://localhost:3000/auth/callback'
    },
    async ({ tokens, profile, context, request }) => {
        const verifiedEmail = profile.id
        assert(verifiedEmail)
        // here you can use the params above to get the user and return it
        // what you do inside this and how you find the user is up to you
        // return await getUser(tokens, profile, context, request);
        // let { access_token: accessToken, refresh_token: refreshToken } = tokens;
        const user: User = {
            email: verifiedEmail
        }
        return user
    }
)

authenticator.use(
    cognitoStrategy,
    // this is optional, but if you setup more than one OAuth2 instance you will
    // need to set a custom name to each one
    'aws-cognito'
)
