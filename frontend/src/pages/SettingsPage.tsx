import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Save, Mail, TestTube } from 'lucide-react';
import { useForm } from 'react-hook-form';
import client from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp } from '@/utils/animations';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => client.get('/settings').then((r) => r.data),
  });

  const { register, handleSubmit } = useForm({
    values: settings,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => client.patch('/settings', data).then((r) => r.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const testEmailMutation = useMutation({
    mutationFn: (email: string) => client.post('/settings/test-email', { email }).then((r) => r.data),
    onSuccess: () => alert('Test email sent!'),
  });

  return (
    <div className="p-8 max-w-2xl">
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure your company's email and API settings</p>
      </motion.div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data as Record<string, string>))} className="space-y-6">
        {/* Sender config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Email Configuration</h2>
          <Input label="Sender Name" placeholder="Acme Procurement" {...register('senderName')} />
          <Input label="Sender Email" type="email" placeholder="procurement@acme.com" {...register('senderEmail')} />
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">API Keys</h2>
          <p className="text-xs text-gray-400">Keys are encrypted at rest. Leave blank to keep existing values.</p>
          <Input
            label="SendGrid API Key (override)"
            type="password"
            placeholder="SG.xxxxxxxx (leave blank to use platform default)"
            {...register('sendgridApiKey')}
          />
          <Input
            label="Hunter.io API Key (optional)"
            type="password"
            placeholder="hunter_xxxxxxxx"
            {...register('hunterApiKey')}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            loading={updateMutation.isPending}
            icon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<TestTube className="w-4 h-4" />}
            onClick={() => {
              const email = prompt('Send test email to:');
              if (email) testEmailMutation.mutate(email);
            }}
          >
            Test Email
          </Button>
        </div>
      </form>

      {/* Test email status */}
      {testEmailMutation.isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-4 h-4 animate-pulse" />
          Sending test email...
        </div>
      )}
    </div>
  );
}
