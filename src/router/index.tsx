import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

function HomePage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12 font-sans">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground">
        Media Education Solutions
      </h1>
      <p className="mt-4 text-muted-foreground">
        Responsive breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1440px
      </p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
