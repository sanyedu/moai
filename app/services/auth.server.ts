// app/services/auth.server.ts
import type { User } from "~/types/user";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { OAuth2Strategy } from "remix-auth-oauth2";

const {
    DOMAIN,
    COGNITO_USER_POOL_URL,
    COGNITO_APP_CLIENT_ID = "",
    COGNITO_APP_CLIENT_SECRET = "",
} = process.env;

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<User>(sessionStorage);

const cognitoStrategy = new OAuth2Strategy<
    User,
    { provider: "aws-cognito" },
    { id_token: string }
>(
    {
        clientId: COGNITO_APP_CLIENT_ID,
        clientSecret: COGNITO_APP_CLIENT_SECRET,

        authorizationEndpoint: `${COGNITO_USER_POOL_URL}/oauth2/authorize`,
        tokenEndpoint: `${COGNITO_USER_POOL_URL}/oauth2/token`,
        redirectURI:
            process.env.NODE_ENV === "production"
                ? `${DOMAIN}/auth/callback`
                : "http://localhost:3000/auth/callback",

        tokenRevocationEndpoint: `${COGNITO_USER_POOL_URL}/oauth2/revoke`, // optional

        codeChallengeMethod: "S256", // optional
        scopes: ["openid", "email", "profile"], // optional

        authenticateWith: "request_body", // optional
    },
    async ({ tokens, profile, context, request }) => {
        // here you can use the params above to get the user and return it
        // what you do inside this and how you find the user is up to you
        // return await getUser(tokens, profile, context, request);
        const user: User = {
            profile,
            tokens,
        };
        return user;
    }
);

authenticator.use(
    cognitoStrategy,
    // this is optional, but if you setup more than one OAuth2 instance you will
    // need to set a custom name to each one
    "aws-cognito"
);
