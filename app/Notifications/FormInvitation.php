<?php

namespace App\Notifications;

use App\Models\FormBuilder;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FormInvitation extends Notification
{
    use Queueable;

    protected $form;
    protected $inviter;

    /**
     * Create a new notification instance.
     */
    public function __construct(FormBuilder $form, User $inviter)
    {
        $this->form = $form;
        $this->inviter = $inviter;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = url("/form-builder/invite/{$this->form->id}");

        return (new MailMessage)
            ->subject('Invitación para colaborar en un formulario')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line($this->inviter->name . ' te ha invitado a colaborar en el formulario "' . $this->form->name . '".')
            ->action('Ver invitación', $url)
            ->line('Haz clic en el botón de arriba para ver y aceptar la invitación.')
            ->line('¡Gracias por usar nuestra aplicación!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'form_id' => $this->form->id,
            'form_name' => $this->form->name,
            'inviter_id' => $this->inviter->id,
            'inviter_name' => $this->inviter->name,
        ];
    }
}
