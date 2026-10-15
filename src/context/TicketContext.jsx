
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '../services/api'

const TicketContext = createContext(null)

function normalizeTicket(ticket) {
  return {
    ...ticket,
    id: String(ticket._id || ticket.id),
    createdAt: ticket.createdAt
      ? new Date(ticket.createdAt).toISOString()
      : new Date().toISOString(),
  }
}

async function requestTickets() {
  const data = await apiRequest('/tickets')
  return (data.tickets || []).map(normalizeTicket)
}

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem('helpdesk_token')),
  )
  const [error, setError] = useState('')

  const refreshTickets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setTickets(await requestTickets())
    } catch (err) {
      setError(err.message || 'Could not load tickets.')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearTickets = useCallback(() => {
    setTickets([])
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('helpdesk_token')) return undefined

    let active = true
    requestTickets()
      .then((nextTickets) => {
        if (active) setTickets(nextTickets)
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load tickets.')
          setTickets([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const addTicket = useCallback(async ({ title, description, priority, category }) => {
    const data = await apiRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        priority,
        category: category || 'General',
      }),
    })

    const ticket = normalizeTicket(data.ticket)
    setTickets((current) => [
      ticket,
      ...current.filter((item) => item.id !== ticket.id),
    ])
    return ticket
  }, [])

  const updateTicketStatus = useCallback(async (id, status) => {
    const data = await apiRequest(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })

    const updatedTicket = normalizeTicket(data.ticket)
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket,
      ),
    )
    return updatedTicket
  }, [])

  const getTicketById = useCallback(
    (id) => tickets.find((ticket) => ticket.id === id),
    [tickets],
  )

  const value = useMemo(
    () => ({
      tickets,
      loading,
      error,
      refreshTickets,
      clearTickets,
      addTicket,
      updateTicketStatus,
      getTicketById,
    }),
    [
      tickets,
      loading,
      error,
      refreshTickets,
      clearTickets,
      addTicket,
      updateTicketStatus,
      getTicketById,
    ],
  )

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketContext)

  if (!context) {
    throw new Error('useTickets must be used within TicketProvider')
  }

  return context
}
