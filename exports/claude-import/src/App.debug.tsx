import React from 'react'

console.log('🔍 DEBUG APP: Loading App.debug.tsx')

const DebugApp: React.FC = () => {
  console.log('🔍 DEBUG APP: Rendering component')

  // Test browser environment
  console.log('🔍 DEBUG APP: Window object:', typeof window !== 'undefined' ? 'AVAILABLE' : 'UNDEFINED')
  console.log('🔍 DEBUG APP: Document object:', typeof document !== 'undefined' ? 'AVAILABLE' : 'UNDEFINED')

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8faff 0%, #e0edfe 100%)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0, 50, 124, 0.1)'
      }}>
        <h1 style={{
          color: '#00327c',
          fontSize: '2.5rem',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🧠 Sunzi Cerebro - JavaScript Runtime Test
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#00327c', fontSize: '1.5rem', marginBottom: '10px' }}>
            Runtime Status Check:
          </h2>

          <div style={{
            background: '#e8f5e8',
            padding: '15px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            ✅ <strong>JavaScript Execution:</strong> WORKING
          </div>

          <div style={{
            background: '#e8f5e8',
            padding: '15px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            ✅ <strong>React Rendering:</strong> WORKING
          </div>

          <div style={{
            background: '#e8f5e8',
            padding: '15px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            ✅ <strong>DOM Mounting:</strong> WORKING
          </div>

          <div style={{
            background: '#e8f5e8',
            padding: '15px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            ✅ <strong>TypeScript Compilation:</strong> WORKING
          </div>
        </div>

        <div style={{
          background: '#f0f7ff',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #00327c'
        }}>
          <h3 style={{ color: '#00327c', marginBottom: '10px' }}>
            🎯 Debugging Information:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Timestamp:</strong> {new Date().toISOString()}</li>
            <li><strong>User Agent:</strong> {navigator.userAgent}</li>
            <li><strong>Window Size:</strong> {window.innerWidth}x{window.innerHeight}</li>
            <li><strong>DOM Ready:</strong> {document.readyState}</li>
            <li><strong>React Version:</strong> {React.version}</li>
          </ul>
        </div>

        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #ffc107',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '10px' }}>
            📊 Next Steps:
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>
            If you can see this page, the React JavaScript runtime is working correctly.
            The issue was likely in the complex authentication flow or async component loading.
            You can now progressively add back the original components.
          </p>
        </div>

        <button
          onClick={() => {
            console.log('🔍 DEBUG APP: Button clicked - Event handling works!')
            alert('🎉 JavaScript events are working! React is fully operational.')
          }}
          style={{
            background: '#00327c',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px',
            display: 'block',
            margin: '20px auto 0'
          }}
        >
          🧪 Test JavaScript Events
        </button>
      </div>
    </div>
  )
}

console.log('🔍 DEBUG APP: Component defined, exporting')

export default DebugApp