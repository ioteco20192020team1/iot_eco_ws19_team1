#ifndef COOKERGUARD_H
#define COOKERGUARD_H

#include <cstddef>
#include <functional>

#define IMAGE_SIZE 64

class CookerGuard {
public:

using set_led_func_t = std::function<void(bool, bool)>;
using send_warning_func_t = std::function<void(void)>;
using time_func_t = std::function<unsigned long(void)>;



    CookerGuard(float move_threshold, float heat_threshold, unsigned long alarm_time);
    
    void register_set_led(set_led_func_t set_led_func);
    void register_send_warning(send_warning_func_t send_warning_func);
    void register_time_func(time_func_t time_func);
    
    void set_heat_threshold(float threshold);
    void set_move_threshold(float threshold);
    
    void set_alarm_time(unsigned long atime);

    void update(float new_image[]);

private:

    
    float move_threshold;
    float heat_threshold;
    
    
    std::array<float, IMAGE_SIZE> old_image;
   // std::array<float, IMAGE_SIZE> difference;

    unsigned long alarm_time;

    bool has_moving_detected;
    
    enum class States { anwesend, abwesend, herd_an, alarm };

    States current_state;
    States next_state;

    //One function for each state
    void abwesend_func();
    void anwesend_func();
    void herd_an_func();
    void alarm_func();

    
    void detect_moving(float new_image[]);
    void update_image(float new_image[]);
    
    float max_image_heat();
    float min_image_heat();
    
    set_led_func_t set_led;
    send_warning_func_t send_warning;
    time_func_t time_func;

};




#endif //COOKERGUARD_H
