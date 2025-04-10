import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';

export default function Login({ props, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        password: '',
        remember: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const onHandleChange = (event) => {
        setData(event.target.name, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    };

    const submit = (e) => {
        e.preventDefault();

        router.post(route('login'), data);
    };

    return (
        <GuestLayout>
            <Head title='Login' />

            {status && <div className="mb-4 font-medium text-sm text-green-400">{status}</div>}

            <form onSubmit={submit}>
                <div className="text-gray-100">
                    <InputLabel forInput="name" value="Name" />

                    <TextInput
                        type="text"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full text-black"
                        autoComplete="username"
                        isFocused={true}
                        handleChange={onHandleChange}
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4 text-gray-100">
                    <InputLabel forInput="password" value="Password" />

                    <TextInput
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full text-black"
                        autoComplete="current-password"
                        handleChange={onHandleChange}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox name="remember" value={data.remember} handleChange={onHandleChange} />

                        <span className="ml-2 text-sm text-gray-400">Remember me</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Button variant='primary'  className="ml-4" disabled={processing}>
                        Login
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
