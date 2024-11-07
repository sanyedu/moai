import { ActionFunctionArgs, json } from '@remix-run/node'
import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from 'antd'
import { authenticator } from '~/services/auth.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // get the user data or redirect to /login if it failed
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: '/'
    })
    return json({ user })
}

export async function action({ request }: ActionFunctionArgs) {
    //TODO: logout on cognito
    await authenticator.logout(request, { redirectTo: '/' })
}

export default function Dashboard() {
    const { user } = useLoaderData<typeof loader>()
    return (
        <div>
            <ul>
                <li>Email: {user.email}</li>
            </ul>
            <Form method="post">
                <Button type="primary" htmlType="submit">
                    Logout
                </Button>
            </Form>
        </div>
    )
}
