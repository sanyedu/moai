import { redirect } from '@remix-run/node'
import { commitSession } from '~/services/session.server'

import { LoaderFunction } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'
import { getSession } from '~/services/session.server'

export const loader: LoaderFunction = async ({ request }) => {
    console.log('callback...')
    const user = await authenticator.authenticate('aws-cognito', request)

    // Manually get the current session
    const session = await getSession(request.headers.get('Cookie'))

    // Store authenticated user details in session
    session.set(authenticator.sessionKey as 'user', user)

    const headers = new Headers({ 'Set-Cookie': await commitSession(session) })

    // Redirect to the application root with updated session
    return redirect('/dashboard', { headers })
}
