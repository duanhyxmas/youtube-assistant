import { useRef, useState, useEffect, ReactElement } from 'react'

interface KeepAliveProps {
  children: ReactElement
  name: string
  isActive: boolean
}

const KeepAlive: React.FC<KeepAliveProps> = ({ children, name, isActive }: KeepAliveProps) => {
  const cache = useRef<Record<string, ReactElement>>({})

  const [cachedChildren, setCachedChildren] = useState<ReactElement | null>(null)

  // update cache
  useEffect(() => {
    if (isActive) {
      cache.current[name] = children
      setCachedChildren(children)
    }
  }, [children, isActive, name])

  const content = isActive ? children : cachedChildren

  return content ? <div style={{ display: isActive ? 'block' : 'none' }}>{content}</div> : null
}

export default KeepAlive
