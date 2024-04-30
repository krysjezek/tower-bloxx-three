import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ThreeScene from './Three'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThreeScene />
  )
}

export default App
