import { JSX } from 'react'

import './index.scss'

const LoadingDots: React.FC = (): JSX.Element => {
  return (
    <div className="ya-loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  )
}

export default LoadingDots
