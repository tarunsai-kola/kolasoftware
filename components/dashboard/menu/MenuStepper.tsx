'use client'

interface MenuStepperProps {
  currentStep: number
  steps: string[]
  onStepClick: (index: number) => void
  theme: { primaryColor: string }
}

export default function MenuStepper({ currentStep, steps, onStepClick, theme }: MenuStepperProps) {
  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, index) => {
            const isCurrent = currentStep === index
            const isComplete = currentStep > index
            
            return (
              <li key={step} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {isComplete ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-indigo-600" style={{ backgroundColor: theme.primaryColor }} />
                    </div>
                    <button
                      onClick={() => onStepClick(index)}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-indigo-900 transition-colors"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">{step}</span>
                    </button>
                  </>
                ) : isCurrent ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <button
                      onClick={() => onStepClick(index)}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white"
                      style={{ borderColor: theme.primaryColor }}
                      aria-current="step"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} aria-hidden="true" />
                      <span className="sr-only">{step}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <button
                      onClick={() => onStepClick(index)}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400 transition-colors"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true" />
                      <span className="sr-only">{step}</span>
                    </button>
                  </>
                )}
                
                {/* Step label for desktop */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max hidden sm:block">
                  <span className={`text-xs font-medium ${isCurrent || isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
