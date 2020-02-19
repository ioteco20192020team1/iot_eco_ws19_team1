

// This #include statement was automatically added by the Particle IDE.
#include "cookerguard.h"


// This #include statement was automatically added by the Particle IDE.
#include "interpolate.h"

// This #include statement was automatically added by the Particle IDE.
#include "grideye.h"

#include "TemperatureSensor.h"
#include "MotionSensor.h"


CookerGuard cooker_guard = CookerGuard(5, 12.0, 10000);

bool blinking = false;
bool output = false;

void set_led(bool on, bool warning_led) {
    
    if (on) {
        digitalWrite(D7, HIGH);
        blinking = warning_led;
    }
    else {
        digitalWrite(D7, LOW);
        blinking = warning_led;
    }
    
}

void init_serial_monitor(){
    Serial.begin(9600);
    Serial.println("Serial Monitor enabled");
}

void send_warning() {
    
    char buffer[128];

    snprintf(buffer, sizeof(buffer), "{ \"id\":\"warning\" }");
    
    Particle.publish("webapp", buffer, PRIVATE);

}


void setup() {
    init_temperature_sensor();
    init_serial_monitor();
    init_motion_sensor();
    init_grid_eye();
    
    pinMode(D7, OUTPUT);

     
    cooker_guard.register_set_led(set_led);
    cooker_guard.register_time_func(millis); 
    cooker_guard.register_send_warning(send_warning);
}


void loop() {
    //testWebHook();
    //print_temperature_to_serial();
    //publish_temperature_to_topic("webapp");
    //print_motion_state_to_serial();
    //publish_motion_state_to("webapp");
    
    unsigned long current_time = millis();
    
    if (current_time % 80 == 0) {
        if (blinking) {
            if (output) {
                digitalWrite(D7, LOW);
            }
            else {
                digitalWrite(D7, HIGH);
            }
            output = !output;
        }
    }
    
    if (current_time % 100 == 0) {
        read_pixels();
        cooker_guard.update(get_pixels());
    
        if (current_time % 500 == 0) {
            publish_pixels_to("webapp");
        }
    }
}

