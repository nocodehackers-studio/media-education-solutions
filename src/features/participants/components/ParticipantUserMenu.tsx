import { useNavigate } from 'react-router-dom'
import { Building2, LogOut, FileText } from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { useParticipantSession } from '@/contexts'

const DIVISION_STORAGE_KEY = 'participant_selected_division'

export function ParticipantUserMenu() {
  const navigate = useNavigate()
  const { session, endSession } = useParticipantSession()

  const displayName = session?.organizationName || session?.code || ''

  const handleLogout = () => {
    sessionStorage.removeItem(DIVISION_STORAGE_KEY)
    endSession()
    navigate('/enter', { replace: true })
  }

  const handleMySubmissions = () => {
    navigate('/participant/submissions')
  }

  const trigger = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm shrink-0"
        >
          <Building2 className="h-4 w-4 mr-2" />
          <span className="max-w-[140px] truncate">{displayName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <button
          type="button"
          onClick={handleMySubmissions}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          My Submissions
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </PopoverContent>
    </Popover>
  )

  return trigger
}
