import { AppBar, Toolbar, Typography, Stack, Button, Container } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Pollify</Typography>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/">Forms</Button>
            <Button component={RouterLink} to="/public">Public Fill</Button>
            <Button component={RouterLink} to="/results">Results</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>{children}</Container>
    </>
  )
}
