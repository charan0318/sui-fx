export default function TestAdmin() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    console.log('Form submitted:', { username, password });
    
    try {
      const response = await fetch('http://localhost:3003/api/v1/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937, #000, #1f2937)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(31, 41, 55, 0.9)',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem'
        }}>
          Test Admin Login
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#d1d5db'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              autoComplete="username"
              required
              style={{
                width: '100%',
                height: '3rem',
                padding: '0 1rem',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#4b5563';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#d1d5db'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                height: '3rem',
                padding: '0 1rem',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#4b5563';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              height: '3rem',
              background: 'linear-gradient(to right, #2563eb, #7c3aed)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #6d28d9)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #7c3aed)';
            }}
          >
            Login
          </button>
        </form>
        
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
          Click inputs to test focus. Check browser console for logs.
        </div>
      </div>
    </div>
  );
}
