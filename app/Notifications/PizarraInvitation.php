<?php

namespace App\Notifications;


use App\Models\Pizarra;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PizarraInvitation extends Notification
{
    use Queueable;

    protected $form;
    protected $inviter;

    /**
     * Create a new notification instance.
     */
    public function __construct(Pizarra $form, User $inviter)
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
        return ['mail','database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = url("/pizarra-flutter/invite/{$this->form->id}");

        return (new MailMessage)
            ->subject('Invitación para colaborar en un formulario')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line($this->inviter->name . ' te ha invitado a colaborar en el formulario "' . $this->form->name . '".')
            ->action('Ver invitación', $url)
            ->line('Haz clic en el botón de arriba para ver y aceptar la invitación.')
            ->line('¡Gracias por usar nuestra aplicación!');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'read_at' => null,
            'type' => 'pizarra_invitation',
            'data' => [
                'form_id' => $this->form->id,
                'form_name' => $this->form->name,
                'inviter_id' => $this->inviter->id,
                'inviter_name' => $this->inviter->name,
                'message' => $this->inviter->name . ' te ha invitado a colaborar en el formulario "' . $this->form->name . '".',
                'url' => url("/pizarra-flutter/invite/{$this->form->id}"),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            'notifiable_id' => $notifiable->id,
            'notifiable_type' => get_class($notifiable),
        ];
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
            'url' => url("/pizarra-flutter/invite/{$this->form->id}"),
        ];
    }
}
