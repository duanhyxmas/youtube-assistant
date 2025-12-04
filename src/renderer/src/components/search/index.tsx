import { JSX, useRef, useState } from 'react'
import { DefaultOptionType } from 'antd/es/select'
import { Input, Button, Spin, AutoComplete } from 'antd'

import { youtubeSearchSuggestion } from '@renderer/utils/request'
const { TextArea } = Input

import packageJson from '@common/../../package.json'

import './index.scss'

interface SearchProps {
  keywords: string
  loading: boolean
  setKeywords: (keywords: string) => void
  handleSearch: () => void
}

const Search: React.FC<SearchProps> = ({
  keywords,
  loading,
  setKeywords,
  handleSearch
}: SearchProps): JSX.Element => {
  const originalKeywords = useRef<string>('')

  const version = useRef<number>(0)

  const [isComposing, setIsComposing] = useState(false)

  const [suggestions, setSuggestions] = useState<DefaultOptionType[]>([])

  const fetchSuggestions = async (value: string): Promise<void> => {
    if (!value) {
      setSuggestions([])
      return
    }

    try {
      version.current += 1
      const targetVersion = version.current
      const suggestionList = await youtubeSearchSuggestion(value)
      if (targetVersion !== version.current) {
        return
      }
      setSuggestions(suggestionList.map((item) => ({ value: item })))
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error)
      setSuggestions([])
    }
  }

  const changeKeywords = (value: string): void => {
    setKeywords(value)
    originalKeywords.current = value
    if (value) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
    }
  }

  const handleCompositionStart = (): void => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>): void => {
    setIsComposing(false)
    if (e.target instanceof HTMLTextAreaElement) {
      changeKeywords(e.target.value)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setKeywords(e.target.value)
    originalKeywords.current = e.target.value

    if (!isComposing && e.target.value) {
      fetchSuggestions(e.target.value)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectSuggestion = (value: string): void => {
    setKeywords(value)
    originalKeywords.current = value
  }

  return (
    <div className="ya-search">
      <h1>{packageJson.productName}</h1>
      <div className="ya-search-input-wrapper">
        <AutoComplete
          options={suggestions}
          value={keywords}
          onChange={changeKeywords}
          onSelect={handleSelectSuggestion}
          onSearch={changeKeywords}
        >
          <TextArea
            placeholder="Enter keywords and press Enter to search"
            value={keywords}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onPressEnter={handleKeyPress}
            autoSize={{ minRows: 4, maxRows: 4 }}
          />
        </AutoComplete>
      </div>
      {loading && <Spin className="ya-search-loading" size="small" />}
      <div className="ya-search-controls">
        <div className="item">
          <Button type="primary" onClick={handleSearch} loading={loading}>
            Search
          </Button>
          <Button onClick={() => setKeywords('')}>Reset</Button>
        </div>
      </div>
    </div>
  )
}

export default Search
