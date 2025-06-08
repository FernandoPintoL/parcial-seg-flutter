import Swal from 'sweetalert2';
export class AlertService{
    success_text = "Exitoso";
    error_text = "Error";
    warning_text = "Advertencia";
    info_text = "Información";

    success(title = this.success_text, message, time = 3000){
        return Swal.fire({
            icon: 'success',
            position: 'top-end',
            title: title,
            text: message,
            timer: time,
            showCloseButton: true,
        });
    }
    error(title = this.error_text, message, time = 3000){
        return Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: title,
            text: message,
            timer: time,
            showCloseButton: true,
        });
    }
    warning(title = this.warning_text, message, time = 3000){
        return Swal.fire({
            position: 'top-end',
            icon: 'warning',
            title: title,
            text: message,
            timer: time,
            showCloseButton: true,
        });
    }
    info(title = this.info_text, message, timer = 3000){
        return Swal.fire({
            icon: 'info',
            position: 'top-end',
            title: title,
            text: message,
            timer: timer,
            showCloseButton: true,
        });
    }
    confirm(title = " ", message) {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, estoy seguro!',
        });
    }
}
