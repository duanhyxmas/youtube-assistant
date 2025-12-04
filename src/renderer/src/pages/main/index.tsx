import { JSX, useState } from 'react'

import Navigation from '@renderer/components/navigation'
import KeepAlive from '@renderer/components/keep-alive'
import framePages from '@renderer/routes'

import './index.scss'

const Main: React.FC = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <div className="ya-main-page">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="ya-main-content">
        {framePages.map((item) => (
          <KeepAlive key={item.name} name={item.name} isActive={currentPage === item.name}>
            <item.page />
          </KeepAlive>
        ))}
      </div>
    </div>
  )
}

export default Main
