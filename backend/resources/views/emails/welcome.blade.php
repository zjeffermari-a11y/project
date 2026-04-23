<x-mail::message>
# Welcome to IAMS!

Hello {{ $user->name }},

Thank you for registering an account with the Internal Audit Management System (IAMS).

Your account status is currently **pending approval**. Our administrators will review your request, and you will receive access once the System Director approves your account.

If you have any questions, please contact the support team.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
