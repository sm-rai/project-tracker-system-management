<x-mail::layout>
    <x-slot:header>
        <x-mail::header :url="config('app.url')">
            <img src="cid:{{ $logoContentId }}" class="logo" alt="Logo Rumah Atsiri Indonesia">
        </x-mail::header>
    </x-slot:header>

# Halo, {{ $userName }}!

Kami menerima permintaan untuk mengatur ulang password akun Anda.

<x-mail::button :url="$url">
Atur Ulang Password
</x-mail::button>

Tautan pengaturan ulang password ini akan kedaluwarsa dalam {{ $expiration }} menit.

Jika Anda tidak meminta pengaturan ulang password, Anda tidak perlu melakukan tindakan apa pun.

Salam,<br>
Tim IT

    <x-slot:footer>
        <x-mail::footer>
            Copyright {{ date('Y') }} Rumah Atsiri Indonesia. Hak cipta dilindungi.
        </x-mail::footer>
    </x-slot:footer>
</x-mail::layout>
