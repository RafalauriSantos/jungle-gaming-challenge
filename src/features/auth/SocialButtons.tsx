import facebook from '@/assets/icons/facebook.svg'
import google from '@/assets/icons/google.svg'
import { Button } from '@/components/ui/button'

// Social sign-in is outside the required flows: shown as in the Figma, disabled, labelled "Em breve".
export function SocialButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[13px]">
        <span aria-hidden className="h-px flex-1 bg-border" />
        Ou continue com
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      {[
        ['Continuar com Google', google],
        ['Continuar com Facebook', facebook],
      ].map(([label, icon]) => (
        <Button key={label} type="button" variant="outline" disabled title="Em breve" className="h-10 gap-3 rounded-[5px] border-border text-[13px] font-medium text-text-secondary disabled:opacity-75">
          <img src={icon} alt="" width={20} height={20} />
          {label}
        </Button>
      ))}
    </div>
  )
}
