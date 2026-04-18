'use client';

import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Cake,
  ExternalLink,
  Venus,
  Clock,
  Briefcase,
  Building2,
  Users,
  User,
} from 'lucide-react';
import { format, formatDistanceToNowStrict, differenceInYears } from 'date-fns';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeeListItem } from '@/features/staff/employees/types';
import { formatCurrency } from '@/lib/utils';

export function EmployeeView({ employee }: { employee: EmployeeListItem }) {
  return (
    <Box className="p-6 space-y-4 overflow-y-auto h-full">
      {/* -- Quick stats row ------------------------------------------------ */}
      <Box className="grid grid-cols-3 gap-3">
        <Box className="rounded-xl border bg-card p-3 flex flex-col gap-1">
          <Box className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="size-3.5" />
            <span className="text-xs">Hourly Rate</span>
          </Box>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatCurrency({ number: employee.rate })}
          </span>
        </Box>
        <Box className="rounded-xl border bg-card p-3 flex flex-col gap-1">
          <Box className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="text-xs">Tenure</span>
          </Box>
          <span className="text-sm font-bold text-foreground">
            {employee.createdAt ? formatDistanceToNowStrict(new Date(employee.createdAt)) : '—'}
          </span>
        </Box>
        <Box className="rounded-xl border bg-card p-3 flex flex-col gap-1">
          <Box className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="size-3.5" />
            <span className="text-xs">Type</span>
          </Box>
          {/* TODO: wire up to employment type field */}
          <span className="text-sm font-bold text-foreground">Casual</span>
        </Box>
      </Box>

      {/* -- Contact card --------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Mail className="size-3.5" />
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2">
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <Box className="flex items-center gap-3">
              <Box className="p-2 rounded-lg bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </Box>
              <Box>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                <a
                  href={`mailto:${employee.email}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {employee.email}
                </a>
              </Box>
            </Box>
            <Button variant="ghost" size="icon" asChild className="size-8">
              <a href={`mailto:${employee.email}`}>
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </Box>

          <Box className="flex items-center justify-between py-2">
            <Box className="flex items-center gap-3">
              <Box className="p-2 rounded-lg bg-muted">
                <Phone className="size-4 text-muted-foreground" />
              </Box>
              <Box>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                {employee.phone ? (
                  <a
                    href={`tel:${employee.phone}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {employee.phone}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">Not provided</span>
                )}
              </Box>
            </Box>
            {employee.phone ? (
              <Button variant="ghost" size="icon" asChild className="size-8">
                <a href={`tel:${employee.phone}`}>
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      {/* -- Role card (TODO: wire up to role/department fields) ------------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="size-3.5" />
            Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2">
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-3.5" />
              Position
            </Box>
            <span className="text-sm font-medium">Nail Technician</span>
          </Box>
          <Box className="flex items-center justify-between py-2">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-3.5" />
              Department
            </Box>
            <span className="text-sm font-medium">Beauty Services</span>
          </Box>
        </CardContent>
      </Card>

      {/* -- Personal card -------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="size-3.5" />
            Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2">
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <Venus className="size-3.5" />
              Gender
            </Box>
            <span className="text-sm font-medium capitalize">
              {employee.gender?.toLowerCase() ?? 'Not specified'}
            </span>
          </Box>
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cake className="size-3.5" />
              Date of Birth
            </Box>
            <Box className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                {employee.dob ? format(new Date(employee.dob), 'MMM d, yyyy') : 'Not specified'}
              </span>
              {employee.dob ? (
                <span className="text-xs text-muted-foreground">
                  ({differenceInYears(new Date(), new Date(employee.dob))} yrs)
                </span>
              ) : null}
            </Box>
          </Box>
          <Box className="flex items-center justify-between py-2">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-3.5" />
              Member since
            </Box>
            <span className="text-sm font-medium">
              {employee.createdAt ? format(new Date(employee.createdAt), 'MMM d, yyyy') : 'N/A'}
            </span>
          </Box>
        </CardContent>
      </Card>

      {/* -- Emergency contact card (TODO: wire up to emergency contact fields) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="size-3.5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2">
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-3.5" />
              Name
            </Box>
            <span className="text-sm font-medium">Jane Smith</span>
          </Box>
          <Box className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Relationship</span>
            <span className="text-sm font-medium">Spouse</span>
          </Box>
          <Box className="flex items-center justify-between py-2">
            <Box className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              Phone
            </Box>
            <a
              href="tel:+61400000000"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              +61 400 000 000
            </a>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
