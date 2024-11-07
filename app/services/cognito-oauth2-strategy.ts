import createDebug from 'debug'
import {
    OAuth2Profile,
    OAuth2Strategy,
    OAuth2StrategyVerifyParams,
    TokenResponseBody
} from 'remix-auth-oauth2'
import type { StrategyVerifyCallback } from 'remix-auth'
import type { JwtPayload } from 'jwt-decode'
import assert from 'assert'

const debug = createDebug('CognitoOAuth2Strategy')

export interface CognitoOAuth2StrategyOptions {
    domain: string | undefined
    clientId: string | undefined
    clientSecret: string | undefined
    redirectURI: string
}

interface CognitoExtraParams extends Record<string, unknown> {
    id_token: string
}

function getVerifiedEmailFromIdToken(idToken: string) {
    // Parse the ID token
    const tokenParts = idToken.split('.')
    const decodedToken = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    )
    // Extract and return the email from the decoded token
    assert(decodedToken && decodedToken.email_verified && decodedToken.email)
    return decodedToken.email
}

export class CognitoOAuth2Strategy<User> extends OAuth2Strategy<
    User,
    OAuth2Profile,
    CognitoExtraParams
> {
    // The OAuth2Strategy already has a name but we can override it
    name = 'aws-cognito'

    private userInfoURL: string

    // We receive our custom options and our verify callback
    constructor(
        options: CognitoOAuth2StrategyOptions,
        verify: StrategyVerifyCallback<
            User,
            OAuth2StrategyVerifyParams<OAuth2Profile, CognitoExtraParams>
        >
    ) {
        assert(options.domain && options.clientId && options.clientSecret)
        // And we pass the options to the super constructor using our own options
        // to generate them, this was we can ask less configuration to the developer
        // using our strategy
        super(
            {
                clientId: options.clientId,
                clientSecret: options.clientSecret,
                redirectURI: options.redirectURI,

                authorizationEndpoint: `https://${options.domain}/oauth2/authorize`,
                tokenEndpoint: `https://${options.domain}/oauth2/token`,
                tokenRevocationEndpoint: `https://${options.domain}/oauth2/revoke`, // optional

                codeChallengeMethod: 'S256', // optional
                scopes: ['openid', 'email', 'profile'], // optional

                authenticateWith: 'request_body' // optional
            },
            verify
        )

        this.userInfoURL = `https://${options.domain}/oauth2/userInfo`
    }

    // We also override how to use the accessToken to get the profile of the user.
    // Here we fetch a Auth0 specific URL, get the profile data, and build the
    // object based on the Auth0Profile interface.

    protected async userProfile(
        tokens: TokenResponseBody & CognitoExtraParams
    ): Promise<OAuth2Profile> {
        assert(tokens.id_token)
        const verifiedEmail = getVerifiedEmailFromIdToken(tokens.id_token)

        // debug("Fetch user info via profile endpoint", this.userInfoURL);
        // debug("Access Token", tokens.access_token);

        // const response = await fetch(this.userInfoURL, {
        //     headers: {
        //         Authorization: `Bearer ${tokens.accessToken}`,
        //         ContentType: "application/x-amz-json-1.1",
        //     },
        //     method: "GET",
        // });
        // const data = await response.json();
        // debug("user info", data);

        const profile: OAuth2Profile = {
            provider: 'aws-cognito',
            id: verifiedEmail
        }

        return profile
    }
}
