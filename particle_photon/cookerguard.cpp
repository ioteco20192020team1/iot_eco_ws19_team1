#include <cmath>
#include "cookerguard.h"



CookerGuard::CookerGuard(float move_threshold, float heat_threshold, unsigned long alarm_time) {
    
    current_state = States::anwesend;
    has_moving_detected = false;

    this->move_threshold = move_threshold * IMAGE_SIZE;
    this->heat_threshold = heat_threshold;
    this->alarm_time = alarm_time;
    
    this->set_led = nullptr;
    this->send_warning = nullptr;
    this->time_func = nullptr;
    
}
          
          
        
void CookerGuard::update(float new_image[]) {
    
    static bool old_image_init= false;
    
    if(old_image_init) {
        detect_moving(new_image);
    }
    
    if (set_led != nullptr) set_led(has_moving_detected, false);
    
    update_image(new_image);
    old_image_init = true;
    
    switch (current_state) {
        case States::anwesend:

            anwesend_func();
            break;
            
        case States::abwesend:
        
            abwesend_func();
            break;
        
        case States::herd_an:
        
            herd_an_func();
            break;
        case States::alarm:
            alarm_func();
            break;
        
        default:
            next_state = States::anwesend;
    }
    
    current_state = next_state;
    
}

void CookerGuard::anwesend_func() {
    
    if (!has_moving_detected) {
        next_state = States::abwesend;
    }
}

void CookerGuard::abwesend_func() {
    
    if (has_moving_detected) {
        next_state = States::anwesend;
    }
    else if (max_image_heat() - min_image_heat() > heat_threshold && max_image_heat() > 40.0) {
        next_state = States::herd_an;
    }
}

void CookerGuard::herd_an_func() {
    
    static unsigned long delay;
    static bool is_timer_running = false;
    
    if (is_timer_running == false) {
        delay = time_func();
        is_timer_running = true;
    }
    
    
    if (max_image_heat() - min_image_heat() < heat_threshold * 0.66f) {
        next_state = States::abwesend;
        is_timer_running = false;
    }
    else if (time_func() - delay > alarm_time) {
        next_state = States::alarm;
        is_timer_running = false;
    }
    else if (has_moving_detected) {
        next_state = States::anwesend;
        is_timer_running = false;
    }
    
    
}

void CookerGuard::alarm_func() {
    
    static bool has_send_warning = false;
    
    if (send_warning != nullptr && !has_send_warning){
        send_warning();
        has_send_warning = true;
    } 
    
    if (set_led != nullptr) set_led(!has_moving_detected, true);
    
    if (has_moving_detected) {
        next_state = States::anwesend;
        has_send_warning = false;
    }
}

void CookerGuard::detect_moving(float new_image[]) {
    
    float anz_anomalien = 0;
    float difference = 0;
    if(max_image_heat() > 150) {
        for (std::size_t i = 0; i < old_image.size(); ++i) {
            difference = old_image[i] - new_image[i];
            
            if (difference > 9) {
                    anz_anomalien++;
                }
                
            has_moving_detected = (anz_anomalien >= 5);
        }
    } else if (max_image_heat() > 40 && max_image_heat() <= 150) {
        for (std::size_t i = 0; i < old_image.size(); ++i) {
            difference = old_image[i] - new_image[i];
                
            if (difference > 4) {
                    anz_anomalien++;
                }
                    
            has_moving_detected = (anz_anomalien >= 3);
        }
    } else {
        for (std::size_t i = 0; i < old_image.size(); ++i) {
            if (new_image[i] < min_image_heat()*1.15) {
                difference = std::abs(old_image[i] - new_image[i]);
                    
                if (difference > 36 - min_image_heat()*1.15) {
                        anz_anomalien++;
                    }
            }
                    
            has_moving_detected = (anz_anomalien >= 5);
        }
    }
    
}


float CookerGuard::max_image_heat() {
    
    float max = 0;
    
    for (float element : old_image) {
        max = std::max(max, element);
    }
    return max;
}

float CookerGuard::min_image_heat() {
    
    float min = 0;
    
    for (float element : old_image) {
        min = std::min(min, element);
    }
    return min;
}

void CookerGuard::update_image(float new_image[]) {
    
  for (std::size_t i = 0; i < old_image.size(); ++i) {
      old_image[i] = new_image[i];
  }
  
}

void CookerGuard::set_heat_threshold(float threshold) {
    heat_threshold = threshold;
};

void CookerGuard::set_move_threshold(float threshold) {
    move_threshold = threshold;
}

void CookerGuard::set_alarm_time(unsigned long atime) {
    alarm_time = atime;
}

void CookerGuard::register_set_led(set_led_func_t set_led_func) {
    set_led = set_led_func;
}

void CookerGuard::register_send_warning(send_warning_func_t send_warning_func) {
    send_warning = send_warning_func;
}

void CookerGuard::register_time_func(time_func_t time_func) {
    this->time_func = time_func;
}
