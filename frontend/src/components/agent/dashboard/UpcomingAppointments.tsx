import { Link } from 'react-router-dom'
import { AppointmentResponse } from '../../../lib/agentAppointmentsApi'
import { EmptyState } from '../../ui/shared'

interface UpcomingAppointmentsProps {
  appointments: AppointmentResponse[]
}

function appointmentDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function appointmentTime(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card" aria-labelledby="upcoming-appointments-heading">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="upcoming-appointments-heading" className="text-lg font-semibold text-navy-900">Upcoming</h2><Link to="/agent/appointments" className="text-sm font-medium text-primary-700 hover:underline">View all</Link></div>
      {appointments.length === 0 ? <EmptyState title="No upcoming appointments" description="Confirmed and requested appointments will appear here." /> : <div className="space-y-4">{appointments.slice(0, 4).map((appointment) => <Link key={appointment.id} to="/agent/appointments" className="flex gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"><div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-border bg-navy-50 p-2"><span className="text-[10px] font-bold uppercase text-navy-500">{appointmentDate(appointment.scheduled_start).split(' ')[0]}</span><span className="text-lg font-semibold text-navy-900">{new Date(appointment.scheduled_start).getDate()}</span></div><div className="min-w-0 border-b border-border pb-3 last:border-0"><h3 className="truncate text-sm font-semibold text-navy-900">{appointment.property.title}</h3><p className="mt-1 truncate text-xs text-navy-500">{appointmentTime(appointment.scheduled_start, appointment.scheduled_end)} · {appointment.client.first_name} {appointment.client.last_name}</p><span className="mt-2 inline-flex rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold uppercase text-navy-700">{appointment.status.replace('_', ' ')}</span></div></Link>)}</div>}
    </section>
  )
}
