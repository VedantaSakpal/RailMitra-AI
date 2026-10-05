import { Train, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Train className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-display font-semibold mb-3">Train Not Found</h2>
        <p className="text-muted-foreground mb-8">
          This platform doesn't exist. Let's get you back on track.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  )
}
